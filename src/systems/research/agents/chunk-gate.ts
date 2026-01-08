import { join } from 'node:path';
import fs from 'node:fs/promises';
import { agent } from 'volcano-sdk';
import { createAzureGPT5Nano } from '../../../core/providers/azure-gpt5-nano-provider.js';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';
import type { ChunkMetadata } from '../utils/chunker.js';
import type { RunLogger } from '../run-logger.js';

/**
 * Gate decision result from LLM
 */
export interface GateDecision {
    content_class: 'core' | 'preface' | 'notes_for_reader' | 'toc' | 'marketing_blurb' | 'about_author' | 'legal' | 'references' | 'index' | 'appendix' | 'unknown';
    relevance_score: number;
    decision: 'SKIP' | 'LIGHT_SCAN' | 'FULL_MODEL';
    confidence: number;
    reasons: string[];
}

/**
 * Extract snippet for gate input (token-minimized)
 */
export function extractGateSnippet(content: string): { head: string; signals: string; tail: string } {
    // HEAD: first ~600-800 chars
    const head = content.slice(0, 700);

    // TAIL: last ~200-300 chars
    const tail = content.slice(-300);

    // SIGNALS: up to 8 sentences that might indicate definitions/procedures
    const signalPatterns = [
        /[A-Z][^.!?]*\bis\s+defined\s+as\b[^.!?]*/gi,
        /[A-Z][^.!?]*\bmeans\s+that\b[^.!?]*/gi,
        /[A-Z][^.!?]*\brefers\s+to\b[^.!?]*/gi,
        /[A-Z][^.!?]*\bsteps?\b[^.!?]*:/gi,
        /[A-Z][^.!?]*\bprocedure\b[^.!?]*/gi,
        /[A-Z][^.!?]*\bprinciple\b[^.!?]*/gi,
        /[A-Z][^.!?]*\bframework\b[^.!?]*/gi,
        /[A-Z][^.!?]*\bconcept\b[^.!?]*/gi,
    ];

    const signalSentences: string[] = [];
    for (const pattern of signalPatterns) {
        const matches = content.match(pattern);
        if (matches) {
            for (const match of matches.slice(0, 2)) {
                if (!signalSentences.includes(match)) {
                    signalSentences.push(match.trim());
                }
            }
        }
        if (signalSentences.length >= 8) break;
    }

    return {
        head,
        signals: signalSentences.join('\n'),
        tail,
    };
}

/**
 * Load the gate prompt template
 */
async function loadGatePrompt(vaultDir: string): Promise<string> {
    const promptPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.prompts, 'prompt-chunk-gate.md');

    try {
        return await fs.readFile(promptPath, 'utf-8');
    } catch {
        // Return default prompt if not found
        return `Return ONLY valid JSON. No markdown. No commentary.

Allowed content_class (choose exactly one):
core, preface, notes_for_reader, toc, marketing_blurb, about_author, legal, references, index, appendix, unknown

Decision:
- FULL_MODEL: core learning content (definitions, explanations, frameworks, procedures, examples).
- LIGHT_SCAN: meta text that may contain assumptions/glossary/prereqs (preface, notes_for_reader).
- SKIP: marketing/testimonials/about-author/legal/TOC/index/reference lists.

Output JSON schema:
{
  "content_class": "<allowed value>",
  "relevance_score": <number 0.0..1.0>,
  "decision": "SKIP" | "LIGHT_SCAN" | "FULL_MODEL",
  "confidence": <number 0.0..1.0>,
  "reasons": ["<short reason 1>", "<short reason 2>", "<short reason 3>"]
}

Text evidence (snippets):
HEAD:
<<<{{head}}>>>

SIGNALS:
<<<{{signals}}>>>

TAIL:
<<<{{tail}}>>>
`;
    }
}

/**
 * Render prompt with snippet values
 */
function renderGatePrompt(template: string, snippet: { head: string; signals: string; tail: string }): string {
    return template
        .replace('{{head}}', snippet.head)
        .replace('{{signals}}', snippet.signals)
        .replace('{{tail}}', snippet.tail);
}

/**
 * Parse gate decision from LLM response
 */
function parseGateDecision(response: string): GateDecision | null {
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.content_class || !parsed.decision) return null;
        if (!['SKIP', 'LIGHT_SCAN', 'FULL_MODEL'].includes(parsed.decision)) return null;

        return {
            content_class: parsed.content_class,
            relevance_score: parsed.relevance_score ? parsed.relevance_score / 100 : 0,
            decision: parsed.decision,
            confidence: parsed.confidence ? parsed.confidence / 100 : 0,
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        };
    } catch {
        return null;
    }
}

/**
 * Apply threshold policy to gate decision
 */
function applyThresholdPolicy(decision: GateDecision): GateDecision {
    // If FULL_MODEL but low confidence, downgrade unless core + high relevance
    if (decision.decision === 'FULL_MODEL' && decision.confidence < 0.55) {
        if (!(decision.content_class === 'core' && decision.relevance_score >= 0.75)) {
            return {
                ...decision,
                decision: 'LIGHT_SCAN',
                reasons: [...decision.reasons, 'Downgraded: low confidence'],
            };
        }
    }
    return decision;
}

/**
 * Run chunk gate on a single chunk
 */
export async function runChunkGate(
    chunkContent: string,
    vaultDir: string,
    logger?: RunLogger
): Promise<GateDecision> {
    const snippet = extractGateSnippet(chunkContent);
    const promptTemplate = await loadGatePrompt(vaultDir);
    const prompt = renderGatePrompt(promptTemplate, snippet);

    try {
        // Use Azure GPT-5-nano for fast, cost-effective gating
        // Note: GPT-5-nano only supports temperature=1.0 (default)
        const gpt5nano = createAzureGPT5Nano({ maxTokens: 500 });

        const result = await agent({ llm: gpt5nano, name: 'ChunkGate' })
            .then({ prompt })
            .run();

        const response = result[0]?.llmOutput || '';
        console.log('[ChunkGate] Raw LLM response:', response.slice(0, 300));
        const decision = parseGateDecision(response);

        if (!decision) {
            // Parse failed - fallback to LIGHT_SCAN
            await logger?.log(`[Gate] Parse failed, defaulting to LIGHT_SCAN`, 'WARN');
            return {
                content_class: 'unknown',
                relevance_score: 0,
                decision: 'LIGHT_SCAN',
                confidence: 0,
                reasons: ['gate_parse_failed'],
            };
        }

        const finalDecision = applyThresholdPolicy(decision);
        await logger?.log(`[Gate] ${finalDecision.decision} (class=${finalDecision.content_class}, conf=${finalDecision.confidence.toFixed(2)})`, 'DEBUG');

        return finalDecision;

    } catch (error: any) {
        // Azure error - fallback to LIGHT_SCAN
        await logger?.log(`[Gate] Azure GPT-5-nano error: ${error.message}. Defaulting to LIGHT_SCAN`, 'WARN');
        return {
            content_class: 'unknown',
            relevance_score: 0,
            decision: 'LIGHT_SCAN',
            confidence: 0,
            reasons: ['gate_error: ' + error.message],
        };
    }
}

/**
 * Run chunk gate on all chunks and update metadata
 */
export async function gateChunks(
    chunks: Array<{ metadata: ChunkMetadata; content: string }>,
    vaultDir: string,
    logger?: RunLogger
): Promise<void> {
    await logger?.log(`[Gate] Processing ${chunks.length} chunks`);

    for (const chunk of chunks) {
        const decision = await runChunkGate(chunk.content, vaultDir, logger);

        // Update chunk metadata
        chunk.metadata.content_class = decision.content_class;
        chunk.metadata.relevance_score = decision.relevance_score;
        chunk.metadata.decision = decision.decision;
        chunk.metadata.gate_confidence = decision.confidence;
        chunk.metadata.gate_reasons = decision.reasons;
    }

    // Count by decision
    const counts = { SKIP: 0, LIGHT_SCAN: 0, FULL_MODEL: 0 };
    for (const chunk of chunks) {
        if (chunk.metadata.decision) {
            counts[chunk.metadata.decision]++;
        }
    }

    await logger?.log(`[Gate] Results: FULL_MODEL=${counts.FULL_MODEL}, LIGHT_SCAN=${counts.LIGHT_SCAN}, SKIP=${counts.SKIP}`);
}
