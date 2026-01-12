/**
 * Extract Agent
 * 
 * Extracts knowledge concepts from chunked documents.
 * Uses parent context to get sourceId from previous agent.
 */

import { agent, StepResult } from 'volcano-sdk';
import { extractFn, ExtractResult } from '../sidecars/extract-sidecar.js';

/**
 * Create an extraction agent
 * 
 * Note: This agent expects to be run after ingest-chunk and will
 * find the sourceId from the parent context.
 */
export function createExtractAgent(vaultDir: string) {
    return agent({
        name: 'extract',
        description: 'Extracts knowledge concepts from document chunks.'
    })
        .then({
            code: async (history: StepResult[]): Promise<ExtractResult> => {
                // Get sourceId from parent context (chunk result)
                const chunkStep = history.find(s => s.mcp?.tool === 'chunk');
                if (!chunkStep) {
                    throw new Error('No chunk step found in history - run ingest-chunk agent first');
                }
                const { sourceId } = JSON.parse(chunkStep.mcp!.result.content[0].text);
                return await extractFn({ sourceId, vaultDir });
            },
            name: 'extract-concepts'
        });
}
