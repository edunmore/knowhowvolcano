/**
 * Corpus Assembler - Build filtered corpora from gated chunks
 * 
 * Step 4 of vNext pipeline: After gating, assemble only FULL_MODEL and LIGHT_SCAN
 * chunks into separate corpora for downstream processing.
 */

import fs from 'node:fs/promises';
import { join } from 'node:path';
import { loadSourceChunks, type LoadedChunk } from './chunk-loader.js';

export interface AssembledCorpus {
    /** Concatenated text from FULL_MODEL chunks */
    fullModelText: string;
    /** Concatenated text from LIGHT_SCAN chunks */
    lightScanText: string;
    /** Chunk IDs included in FULL_MODEL corpus */
    fullModelChunkIds: string[];
    /** Chunk IDs included in LIGHT_SCAN corpus */
    lightScanChunkIds: string[];
    /** Statistics */
    stats: {
        totalChunks: number;
        fullModelChunks: number;
        lightScanChunks: number;
        skipChunks: number;
        fullModelChars: number;
        lightScanChars: number;
    };
}

/**
 * Format chunk with ID separator for corpus assembly.
 * Preserves chunk ID for traceability in extraction.
 */
function formatChunkForCorpus(chunk: LoadedChunk): string {
    return `=== CHUNK: ${chunk.metadata.id} ===\n${chunk.content}\n`;
}

/**
 * Assemble filtered corpora from gated chunks.
 * 
 * @param vaultDir - Path to the vault directory
 * @param sourceId - Source ID to load chunks from
 * @param runId - Run ID for persisting corpus files (optional)
 * @returns AssembledCorpus with separated FULL_MODEL and LIGHT_SCAN text
 */
export async function assembleFilteredCorpus(
    vaultDir: string,
    sourceId: string,
    runId?: string
): Promise<AssembledCorpus> {
    // Load all chunks for this source
    const chunks = await loadSourceChunks(vaultDir, sourceId);

    // Sort by sequence number to maintain order
    chunks.sort((a, b) => a.metadata.seq - b.metadata.seq);

    // Separate by decision
    const fullModelChunks: LoadedChunk[] = [];
    const lightScanChunks: LoadedChunk[] = [];
    let skipCount = 0;

    for (const chunk of chunks) {
        const decision = chunk.metadata.decision;
        if (decision === 'FULL_MODEL') {
            fullModelChunks.push(chunk);
        } else if (decision === 'LIGHT_SCAN') {
            lightScanChunks.push(chunk);
        } else {
            // SKIP or undefined
            skipCount++;
        }
    }

    // Assemble corpora with chunk ID separators
    const fullModelText = fullModelChunks.map(formatChunkForCorpus).join('\n');
    const lightScanText = lightScanChunks.map(formatChunkForCorpus).join('\n');

    const corpus: AssembledCorpus = {
        fullModelText,
        lightScanText,
        fullModelChunkIds: fullModelChunks.map(c => c.metadata.id),
        lightScanChunkIds: lightScanChunks.map(c => c.metadata.id),
        stats: {
            totalChunks: chunks.length,
            fullModelChunks: fullModelChunks.length,
            lightScanChunks: lightScanChunks.length,
            skipChunks: skipCount,
            fullModelChars: fullModelText.length,
            lightScanChars: lightScanText.length,
        },
    };

    // Persist to _runs/<runId>/corpus/ if runId provided
    if (runId) {
        const corpusDir = join(vaultDir, '_runs', runId, 'corpus');
        await fs.mkdir(corpusDir, { recursive: true });

        await fs.writeFile(
            join(corpusDir, 'FULL_MODEL_TEXT.md'),
            fullModelText || '# No FULL_MODEL chunks\n'
        );

        await fs.writeFile(
            join(corpusDir, 'LIGHT_SCAN_TEXT.md'),
            lightScanText || '# No LIGHT_SCAN chunks\n'
        );

        await fs.writeFile(
            join(corpusDir, 'corpus-stats.json'),
            JSON.stringify(corpus.stats, null, 2)
        );
    }

    return corpus;
}

/**
 * Load previously assembled corpus from a run directory.
 */
export async function loadAssembledCorpus(
    vaultDir: string,
    runId: string
): Promise<AssembledCorpus | null> {
    const corpusDir = join(vaultDir, '_runs', runId, 'corpus');

    try {
        const [fullModelText, lightScanText, statsJson] = await Promise.all([
            fs.readFile(join(corpusDir, 'FULL_MODEL_TEXT.md'), 'utf-8'),
            fs.readFile(join(corpusDir, 'LIGHT_SCAN_TEXT.md'), 'utf-8'),
            fs.readFile(join(corpusDir, 'corpus-stats.json'), 'utf-8'),
        ]);

        const stats = JSON.parse(statsJson);

        // Extract chunk IDs from corpus text
        const fullModelChunkIds = extractChunkIds(fullModelText);
        const lightScanChunkIds = extractChunkIds(lightScanText);

        return {
            fullModelText,
            lightScanText,
            fullModelChunkIds,
            lightScanChunkIds,
            stats,
        };
    } catch {
        return null;
    }
}

/**
 * Extract chunk IDs from corpus text.
 */
function extractChunkIds(corpusText: string): string[] {
    const regex = /=== CHUNK: ([\w_]+) ===/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(corpusText)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}
