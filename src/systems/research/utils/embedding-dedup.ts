/**
 * Embedding Dedup Utilities
 * 
 * Centralized logic for semantic deduplication using embeddings.
 * Handles keyword generation, LLM verification, and duplicate tracking.
 */

import { createAzureGPT5Nano } from '../../../core/providers/azure-gpt5-nano-provider.js';
import { agent } from 'volcano-sdk';
import type { Candidate } from '../agents/extractor.js';
import type { VectorStore } from './vector-store.js';
import type { RunLogger } from '../run-logger.js';

/**
 * Result of a dedup check
 */
export interface DedupResult {
    isDuplicate: boolean;
    action: 'CREATE' | 'SKIP' | 'MERGE' | 'LINK_RELATED';
    matchedNote?: {
        id: string;
        title: string;
        filePath: string;
        similarity: number;
    };
    reason?: string;
}

/**
 * Track duplicates found during processing for later link creation
 */
export interface DuplicateRecord {
    candidateName: string;
    candidateType: string;
    matchedNoteId: string;
    matchedNoteTitle: string;
    matchedFilePath: string;
    similarity: number;
    sourceChunk?: string;
}

/**
 * Generate better embedding keywords from a candidate.
 * Uses name, reason, and a snippet from the quote for richer semantics.
 */
export function generateCandidateKeywords(candidate: Candidate): string[] {
    const keywords: Set<string> = new Set();

    // 1. Words from name (filtered for length)
    const nameWords = candidate.name
        .toLowerCase()
        .split(/[\s\-_]+/)
        .filter(w => w.length > 2 && !isStopWord(w));
    nameWords.forEach(w => keywords.add(w));

    // 2. Key words from reason (extract nouns/adjectives)
    if (candidate.reason) {
        const reasonWords = candidate.reason
            .toLowerCase()
            .split(/[\s,\.;:\-]+/)
            .filter(w => w.length > 3 && !isStopWord(w))
            .slice(0, 5);  // Take top 5 from reason
        reasonWords.forEach(w => keywords.add(w));
    }

    // 3. Key words from quote snippet (first 100 chars)
    if (candidate.quote) {
        const quoteSnippet = candidate.quote.slice(0, 100);
        const quoteWords = quoteSnippet
            .toLowerCase()
            .split(/[\s,\.;:\-\"\']+/)
            .filter(w => w.length > 4 && !isStopWord(w))
            .slice(0, 3);  // Take top 3 from quote
        quoteWords.forEach(w => keywords.add(w));
    }

    return Array.from(keywords);
}

/**
 * Generate embedding text from candidate - richer than just keywords
 */
export function generateEmbeddingText(candidate: Candidate): string {
    const parts = [candidate.name];

    if (candidate.reason) {
        parts.push(candidate.reason);
    }

    if (candidate.quote) {
        // Add first sentence of quote
        const firstSentence = candidate.quote.split(/[.!?]/)[0]?.trim();
        if (firstSentence && firstSentence.length < 200) {
            parts.push(firstSentence);
        }
    }

    return parts.join(' | ');
}

/**
 * Check if a candidate is a duplicate using embedding search + LLM verification.
 * 
 * Thresholds:
 * - > 0.9: HIGH confidence → auto-merge
 * - 0.7-0.9: MEDIUM confidence → LLM verification
 * - < 0.7: LOW confidence → create new
 */
export async function checkDuplicate(
    candidate: Candidate,
    vectorStore: VectorStore,
    logger: RunLogger,
    options: {
        threshold?: number;
        verifyAmbiguous?: boolean;
    } = {}
): Promise<DedupResult> {
    const threshold = options.threshold ?? 0.7;
    const verifyAmbiguous = options.verifyAmbiguous ?? true;

    // Generate rich keywords for search
    const keywords = generateCandidateKeywords(candidate);

    // Search for matches
    const match = await vectorStore.findExistingMatch(
        candidate.name,
        keywords,
        0.5  // Lower threshold to find candidates for verification
    );

    if (!match) {
        return { isDuplicate: false, action: 'CREATE' };
    }

    const { similarity } = match;

    // HIGH confidence (>0.9) - auto-merge
    if (similarity >= 0.9) {
        await logger.log(`[Dedup] HIGH confidence: "${candidate.name}" ↔ "${match.match.title}" (${(similarity * 100).toFixed(0)}%) → MERGE`);
        return {
            isDuplicate: true,
            action: 'MERGE',
            matchedNote: {
                id: match.match.id,
                title: match.match.title,
                filePath: match.match.filePath,
                similarity
            },
            reason: 'High confidence semantic match'
        };
    }

    // MEDIUM confidence (0.7-0.9) - LLM verification
    if (similarity >= threshold && verifyAmbiguous) {
        await logger.log(`[Dedup] MEDIUM confidence: "${candidate.name}" ↔ "${match.match.title}" (${(similarity * 100).toFixed(0)}%) → verifying...`);

        const isSameConcept = await verifyDuplicateWithLLM(
            candidate.name,
            match.match.title,
            candidate.reason || '',
            logger
        );

        if (isSameConcept) {
            await logger.log(`[Dedup] LLM confirmed: same concept → SKIP and LINK`);
            return {
                isDuplicate: true,
                action: 'SKIP',
                matchedNote: {
                    id: match.match.id,
                    title: match.match.title,
                    filePath: match.match.filePath,
                    similarity
                },
                reason: 'LLM verified as same concept'
            };
        } else {
            await logger.log(`[Dedup] LLM says: different concepts → CREATE and possibly link as related`);
            return {
                isDuplicate: false,
                action: 'LINK_RELATED',
                matchedNote: {
                    id: match.match.id,
                    title: match.match.title,
                    filePath: match.match.filePath,
                    similarity
                },
                reason: 'LLM verified as related but different concept'
            };
        }
    }

    // At or above threshold but not verifying
    if (similarity >= threshold) {
        return {
            isDuplicate: true,
            action: 'SKIP',
            matchedNote: {
                id: match.match.id,
                title: match.match.title,
                filePath: match.match.filePath,
                similarity
            }
        };
    }

    // Below threshold but have a potential match
    if (similarity >= 0.5) {
        return {
            isDuplicate: false,
            action: 'LINK_RELATED',
            matchedNote: {
                id: match.match.id,
                title: match.match.title,
                filePath: match.match.filePath,
                similarity
            },
            reason: 'Below threshold but potentially related'
        };
    }

    return { isDuplicate: false, action: 'CREATE' };
}

/**
 * Use GPT-5-nano to verify if two concepts are the same.
 */
async function verifyDuplicateWithLLM(
    candidateName: string,
    existingName: string,
    candidateContext: string,
    logger: RunLogger
): Promise<boolean> {
    const gpt5nano = createAzureGPT5Nano({ maxTokens: 50 });

    const prompt = `Are these the SAME concept or are they DIFFERENT concepts?

Concept A: "${candidateName}"
Context: ${candidateContext || 'No additional context'}

Concept B: "${existingName}"

Answer with ONLY one word: SAME or DIFFERENT`;

    try {
        const result = await agent({ llm: gpt5nano, name: 'DedupVerifier' })
            .then({ prompt })
            .run();

        const output = result[0]?.llmOutput?.trim().toUpperCase() || '';

        if (output.includes('SAME')) {
            return true;
        } else if (output.includes('DIFFERENT')) {
            return false;
        }

        // Ambiguous response - be conservative, create new
        await logger.log(`[Dedup] Ambiguous LLM response: "${output}" → treating as different`, 'WARN');
        return false;

    } catch (e: any) {
        await logger.log(`[Dedup] LLM verification failed: ${e.message} → treating as different`, 'WARN');
        return false;
    }
}

/**
 * Common stop words to filter out from keywords
 */
function isStopWord(word: string): boolean {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them',
        'their', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
        'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
        'some', 'such', 'than', 'too', 'very', 'just', 'also', 'not', 'about'
    ]);
    return stopWords.has(word.toLowerCase());
}
