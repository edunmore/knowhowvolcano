/**
 * Autonomous Runbook Coordinator (Canon-style)
 * 
 * Uses Volcano SDK multi-agent pattern to create a fully autonomous coordinator.
 * LLM decides what to do, returns structured output, orchestrator writes files.
 * 
 * Key features:
 * - Coordinator agent with DeepSeek for quality reasoning
 * - LLM returns JSON with decisions, not actual tool calls
 * - Orchestrator executes file operations programmatically
 * - Self-improvement: can propose runbook modifications
 */

import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import fs from 'node:fs/promises';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { createDeepSeekWithTools } from '../../core/providers/deepseek-tools-provider.js';
import { createOllamaProvider } from '../../core/providers/ollama-provider.js';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';
import type { RunLogger } from './run-logger.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RunbookGoals {
    runbook_id: string;
    version: string;
    description?: string;
    goals: string[];
    constraints?: {
        max_tokens?: number;
        max_cost_usd?: number;
        max_retries?: number;
        min_verification_pass_rate?: number;
    };
    preferences?: Record<string, any>;
    self_improvement?: {
        enabled: boolean;
        log_path?: string;
    };
}

export interface VaultState {
    sourceCount: number;
    chunkCount: number;
    noteCount: number;
    lastRunId?: string;
    recentNotes?: string[];
}

export interface CoordinatorResult {
    runId: string;
    status: 'completed' | 'failed' | 'partial';
    summary: string;
    notesCreated: string[];
    chunksProcessed: number;
    issues: string[];
    improvements?: string[];
    tokenUsage?: number;
    duration_ms: number;
}

// LLM returns this structured output
interface CoordinatorDecision {
    chunks: Array<{
        id: string;
        content: string;
        decision: 'SKIP' | 'LIGHT_SCAN' | 'FULL_MODEL';
        reason: string;
    }>;
    notes: Array<{
        id: string;
        type: 'concept' | 'procedure' | 'principle' | 'misconception';
        content: string;
    }>;
    summary: string;
    improvements?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Vault State
// ═══════════════════════════════════════════════════════════════════════════

async function getVaultState(vaultDir: string): Promise<VaultState> {
    let sourceCount = 0;
    let chunkCount = 0;
    let noteCount = 0;
    const recentNotes: string[] = [];

    try {
        const sourcesDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.sources);
        const sources = await fs.readdir(sourcesDir).catch(() => []);
        sourceCount = sources.length;

        for (const source of sources) {
            const chunksDir = join(sourcesDir, source, 'chunks');
            const chunks = await fs.readdir(chunksDir).catch(() => []);
            chunkCount += chunks.length;
        }

        const conceptsDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.concepts);
        const notes = await fs.readdir(conceptsDir).catch(() => []);
        noteCount = notes.filter(f => f.endsWith('.md')).length;

        for (const note of notes.slice(-5)) {
            if (note.endsWith('.md')) {
                recentNotes.push(note.replace('.md', ''));
            }
        }
    } catch {
        // Vault may be empty
    }

    return { sourceCount, chunkCount, noteCount, recentNotes };
}

// ═══════════════════════════════════════════════════════════════════════════
// Parse LLM Response
// ═══════════════════════════════════════════════════════════════════════════

function parseCoordinatorResponse(content: string, logger?: RunLogger): CoordinatorDecision | null {
    // Method 0: Try direct JSON.parse first (LLM may return clean JSON)
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
        try {
            console.log('[Parser] Attempting direct JSON parse...');
            return JSON.parse(trimmed);
        } catch (e: any) {
            console.log(`[Parser] Direct parse failed: ${e.message}`);
        }
    }

    // Method 1: Extract from ```json code block (may or may not have closing ```)
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*)/);
    if (jsonBlockMatch) {
        // Remove trailing ``` if present
        let jsonContent = jsonBlockMatch[1].replace(/```\s*$/, '').trim();

        try {
            console.log('[Parser] Found JSON code block, attempting parse...');
            return JSON.parse(jsonContent);
        } catch (e: any) {
            console.log(`[Parser] JSON block parse failed: ${e.message}`);

            // Try to find the JSON object/array and complete it if truncated
            const jsonStart = jsonContent.indexOf('{');
            if (jsonStart >= 0) {
                jsonContent = jsonContent.slice(jsonStart);

                // Count braces to find if JSON is truncated
                const repaired = repairJson(jsonContent);
                if (repaired) {
                    console.log('[Parser] Successfully repaired truncated JSON');
                    return repaired;
                }
            }
        }
    }

    // Method 2: Extract notes section specifically
    const notesMatch = content.match(/"notes"\s*:\s*\[([\s\S]*?)\]/);
    if (notesMatch) {
        try {
            console.log('[Parser] Found notes array, attempting extraction...');
            const notesJson = `[${notesMatch[1]}]`;
            const notes = JSON.parse(notesJson);

            // Build minimal decision with just notes
            return {
                chunks: [],
                notes: notes,
                summary: 'Extracted notes from partial JSON'
            };
        } catch (e: any) {
            console.log(`[Parser] Notes extraction failed: ${e.message}`);
        }
    }

    // Method 3: Find individual note objects via regex
    const noteMatches = content.matchAll(/"id"\s*:\s*"([^"]+)"[\s\S]*?"type"\s*:\s*"(concept|procedure|principle|misconception)"[\s\S]*?"content"\s*:\s*"([\s\S]*?)(?<!\\)"\s*}/g);
    const extractedNotes: any[] = [];

    for (const match of noteMatches) {
        if (match[1] && match[2] && match[3]) {
            extractedNotes.push({
                id: match[1],
                type: match[2],
                content: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n')
            });
        }
    }

    if (extractedNotes.length > 0) {
        console.log(`[Parser] Extracted ${extractedNotes.length} notes via regex`);
        return {
            chunks: [],
            notes: extractedNotes,
            summary: `Extracted ${extractedNotes.length} notes from content`
        };
    }

    console.log('[Parser] All parsing methods failed');
    console.log('[Parser] First 500 chars:', content.slice(0, 500));
    return null;
}

// Attempt to repair malformed JSON
function repairJson(jsonStr: string): CoordinatorDecision | null {
    try {
        // First try to find last complete JSON object
        let depth = 0;
        let lastValidEnd = -1;
        let inString = false;
        let escape = false;

        for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '\\') {
                escape = true;
                continue;
            }

            if (char === '"' && !escape) {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '{') depth++;
                else if (char === '}') {
                    depth--;
                    if (depth === 0) lastValidEnd = i;
                }
            }
        }

        if (lastValidEnd > 0) {
            const trimmed = jsonStr.slice(0, lastValidEnd + 1);
            return JSON.parse(trimmed);
        }

        // If no complete object, try to close incomplete structures
        console.log('[Parser] Attempting to close truncated JSON...');

        // Find where we have notes array with at least some content
        const notesMatch = jsonStr.match(/"notes"\s*:\s*\[([\s\S]*)/);
        if (notesMatch) {
            let notesContent = notesMatch[1];

            // Try to extract complete note objects (ending with })
            const noteObjects: string[] = [];
            let currentNote = '';
            let noteDepth = 0;
            inString = false;
            escape = false;

            for (let i = 0; i < notesContent.length; i++) {
                const char = notesContent[i];

                if (escape) {
                    escape = false;
                    if (noteDepth > 0) currentNote += char;
                    continue;
                }

                if (char === '\\') {
                    escape = true;
                    if (noteDepth > 0) currentNote += char;
                    continue;
                }

                if (char === '"' && !escape) {
                    inString = !inString;
                    if (noteDepth > 0) currentNote += char;
                    continue;
                }

                if (!inString) {
                    if (char === '{') {
                        noteDepth++;
                        currentNote += char;
                    } else if (char === '}') {
                        currentNote += char;
                        noteDepth--;
                        if (noteDepth === 0) {
                            noteObjects.push(currentNote.trim());
                            currentNote = '';
                        }
                    } else if (noteDepth > 0) {
                        currentNote += char;
                    }
                } else if (noteDepth > 0) {
                    currentNote += char;
                }
            }

            if (noteObjects.length > 0) {
                console.log(`[Parser] Extracted ${noteObjects.length} complete note objects from truncated JSON`);
                // Clean up: remove trailing commas and whitespace from each object
                const cleanedNotes = noteObjects.map(n => n.replace(/,\s*$/, '').trim());
                const repairedJson = `{"notes":[${cleanedNotes.join(',')}],"summary":"Recovered from truncated response"}`;
                return JSON.parse(repairedJson);
            }
        }
    } catch (e: any) {
        console.log(`[Parser] JSON repair failed: ${e.message}`);
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Execute File Operations
// ═══════════════════════════════════════════════════════════════════════════

async function executeDecisions(
    decision: CoordinatorDecision,
    vaultDir: string,
    sourceId: string,
    logger?: RunLogger
): Promise<{ notesCreated: string[], chunksWritten: number }> {
    const notesCreated: string[] = [];
    let chunksWritten = 0;

    // Create source directory
    const chunksDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.sources, sourceId, 'chunks');
    mkdirSync(chunksDir, { recursive: true });
    await logger?.log(`[Executor] Created chunks dir: ${chunksDir}`);

    // Write chunks (if any)
    if (decision.chunks) {
        for (const chunk of decision.chunks) {
            if (chunk.decision !== 'SKIP' && chunk.content) {
                const chunkPath = join(chunksDir, `${chunk.id}.md`);
                writeFileSync(chunkPath, chunk.content);
                chunksWritten++;
                await logger?.log(`[Executor] Wrote chunk: ${chunk.id} (${chunk.decision})`);
            }
        }
    }

    // Write notes - handle both old and new formats
    if (decision.notes) {
        for (const note of decision.notes) {
            if (note.id) {
                const noteType = note.type || 'concept';
                let notesDir: string;

                switch (noteType) {
                    case 'procedure':
                        notesDir = resolveVaultPath(vaultDir, 'procedures');
                        break;
                    case 'principle':
                        notesDir = resolveVaultPath(vaultDir, 'principles');
                        break;
                    default:
                        notesDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.concepts);
                }

                mkdirSync(notesDir, { recursive: true });
                const notePath = join(notesDir, `${note.id}.md`);

                // Generate markdown content from structured fields
                let noteContent: string;
                if (note.content) {
                    // Old format - content is already markdown
                    noteContent = note.content;
                } else {
                    // New format - build markdown from fields
                    const n = note as any;
                    noteContent = `---
id: ${note.id}
type: ${noteType}
domain: coaching
derived_from: ${sourceId}
---

## ${n.title || note.id}

${n.definition || ''}

## Key Points

${(n.key_points || []).map((p: string) => `- ${p}`).join('\n')}

## Evidence

> "${n.evidence || ''}"
`;

                    // Add LINK_INTENTS JSON block if present
                    if (n.link_intents && Array.isArray(n.link_intents) && n.link_intents.length > 0) {
                        noteContent += `
\`\`\`json
{
  "note_id": "${note.id}",
  "link_intents": ${JSON.stringify(n.link_intents, null, 2)}
}
\`\`\`
`;
                    }
                }

                writeFileSync(notePath, noteContent);
                notesCreated.push(note.id);
                await logger?.log(`[Executor] Wrote note: ${note.id} (${noteType})`);
            }
        }
    }

    return { notesCreated, chunksWritten };
}

// ═══════════════════════════════════════════════════════════════════════════
// Autonomous Coordinator
// ═══════════════════════════════════════════════════════════════════════════

export async function runAutonomousCoordinator(
    runbook: RunbookGoals,
    vaultDir: string,
    inputFile: string,
    logger?: RunLogger
): Promise<CoordinatorResult> {
    const runId = `run-${Date.now()}`;
    const sourceId = `src_${Date.now()}`;
    const startTime = Date.now();
    const absoluteVaultDir = resolve(vaultDir);

    await logger?.log(`[Coordinator] Starting autonomous run: ${runId}`);
    await logger?.log(`[Coordinator] Runbook: ${runbook.runbook_id} v${runbook.version}`);

    // Create LLM providers
    const deepseek = createDeepSeekWithTools();  // For quality reasoning

    // Get current vault state
    const vaultState = await getVaultState(vaultDir);
    await logger?.log(`[Coordinator] Vault state: ${vaultState.sourceCount} sources, ${vaultState.chunkCount} chunks, ${vaultState.noteCount} notes`);

    // Read input file content
    const inputContent = await fs.readFile(inputFile, 'utf-8');
    await logger?.log(`[Coordinator] Input file: ${inputFile} (${inputContent.length} chars)`);

    // Load coordinator prompt from vault (CRITICAL: prompts must come from vault, never hardcoded)
    const promptPath = resolveVaultPath(vaultDir, '_system', 'prompts', 'prompt-coordinator.md');
    const promptFile = await fs.readFile(promptPath, 'utf-8').catch(async () => {
        // Fallback to template vault if not in target vault
        const templatePath = resolve(__dirname, 'vault/_system/prompts/prompt-coordinator.md');
        return fs.readFile(templatePath, 'utf-8');
    });

    // Parse frontmatter and extract template body
    const frontmatterMatch = promptFile.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const promptTemplate = frontmatterMatch ? frontmatterMatch[1].trim() : promptFile;

    // Apply handlebars-style variable substitution
    const coordinatorPrompt = promptTemplate
        .replace(/\{\{source_name\}\}/g, basename(inputFile))
        .replace(/\{\{source_id\}\}/g, sourceId)
        .replace(/\{\{content_length\}\}/g, String(inputContent.length))
        .replace(/\{\{content\}\}/g, inputContent.slice(0, 12000))
        .replace(/\{\{#if recent_notes\}\}[\s\S]*?\{\{recent_notes\}\}[\s\S]*?\{\{\/if\}\}/g,
            vaultState.recentNotes?.length
                ? `6. Avoid duplicating: ${vaultState.recentNotes.join(', ')}`
                : '');

    try {
        // Run the coordinator agent
        await logger?.log(`[Coordinator] Calling LLM for decisions...`);

        const results = await agent({
            llm: deepseek,
            timeout: 300,
            name: 'RunbookCoordinator'
        })
            .then({ prompt: coordinatorPrompt })
            .run();

        const llmOutput = results[0]?.llmOutput || '';
        await logger?.log(`[Coordinator] LLM response: ${llmOutput.length} chars`);

        // Save raw LLM output for debugging
        const debugDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runs, 'coordinator', runId);
        mkdirSync(debugDir, { recursive: true });
        writeFileSync(join(debugDir, 'llm_output.txt'), llmOutput);
        await logger?.log(`[Coordinator] Saved raw output to ${debugDir}/llm_output.txt`);

        // Parse the structured response
        const decision = parseCoordinatorResponse(llmOutput);

        if (!decision) {
            throw new Error('Failed to parse coordinator response as JSON');
        }

        await logger?.log(`[Coordinator] Parsed: ${decision.chunks?.length || 0} chunks, ${decision.notes?.length || 0} notes`);

        // Execute the file operations programmatically (like canon system)
        const { notesCreated, chunksWritten } = await executeDecisions(
            decision,
            vaultDir,
            sourceId,
            logger
        );

        const duration_ms = Date.now() - startTime;

        // Build result
        const result: CoordinatorResult = {
            runId,
            status: 'completed',
            summary: decision.summary || `Processed ${chunksWritten} chunks, created ${notesCreated.length} notes`,
            notesCreated,
            chunksProcessed: chunksWritten,
            issues: [],
            improvements: decision.improvements,
            duration_ms
        };

        // Log self-improvement suggestions if enabled
        if (runbook.self_improvement?.enabled && decision.improvements?.length) {
            const logPath = runbook.self_improvement.log_path || '_runs/improvements.json';
            const fullLogPath = resolveVaultPath(vaultDir, logPath);
            mkdirSync(join(fullLogPath, '..'), { recursive: true });

            const improvement = {
                runId,
                timestamp: new Date().toISOString(),
                suggestions: decision.improvements
            };

            let existingLog: any[] = [];
            try {
                const existing = await fs.readFile(fullLogPath, 'utf-8');
                existingLog = JSON.parse(existing);
            } catch { }
            existingLog.push(improvement);
            writeFileSync(fullLogPath, JSON.stringify(existingLog, null, 2));
        }

        // Save run result
        const runDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runs, 'coordinator', runId);
        mkdirSync(runDir, { recursive: true });
        writeFileSync(
            join(runDir, 'result.json'),
            JSON.stringify(result, null, 2)
        );
        writeFileSync(
            join(runDir, 'decision.json'),
            JSON.stringify(decision, null, 2)
        );

        await logger?.log(`[Coordinator] Completed in ${duration_ms}ms`);
        await logger?.log(`[Coordinator] Notes created: ${notesCreated.length}`);

        return result;

    } catch (error: any) {
        const duration_ms = Date.now() - startTime;
        await logger?.log(`[Coordinator] Failed: ${error.message}`, 'ERROR');

        return {
            runId,
            status: 'failed',
            summary: `Run failed: ${error.message}`,
            notesCreated: [],
            chunksProcessed: 0,
            issues: [error.message],
            duration_ms
        };
    }
}
