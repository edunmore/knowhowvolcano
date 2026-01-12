/**
 * Ingest+Chunk Agent
 * 
 * Ingests a source file and chunks it into semantic pieces.
 * Uses code steps for direct function execution.
 */

import { agent, StepResult } from 'volcano-sdk';
import { ingestFn, chunkFn, IngestResult, ChunkResult } from '../sidecars/ingest-chunk-sidecar.js';

/**
 * Create an ingest+chunk agent
 */
export function createIngestChunkAgent(sourcePath: string, vaultDir: string) {
    return agent({
        name: 'ingest-chunk',
        description: 'Ingests a source document and splits it into semantic chunks.'
    })
        .then({
            code: async (): Promise<IngestResult> => {
                return await ingestFn({ sourcePath, vaultDir });
            },
            name: 'ingest'
        })
        .then({
            code: async (history: StepResult[]): Promise<ChunkResult> => {
                const prev = history[history.length - 1];
                const { sourceId } = JSON.parse(prev.mcp!.result.content[0].text);
                return await chunkFn({ sourceId, vaultDir });
            },
            name: 'chunk'
        });
}
