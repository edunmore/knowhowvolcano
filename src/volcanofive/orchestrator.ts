/**
 * Orchestrator Agent
 * 
 * Uses code steps for direct function execution - no MCP/LLM overhead.
 */

import { agent } from 'volcano-sdk';
import { ingest } from './mcp-server/tools/ingest.js';
import { chunk } from './mcp-server/tools/chunk.js';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Run the extraction pipeline using code steps
 * 
 * Direct function calls - no MCP subprocess, no LLM tokens!
 */
export async function runPipeline(sourcePath: string, vaultDir: string) {
    console.log('🌋 volcanofive - Code Step Pipeline');
    console.log(`Source: ${sourcePath}`);
    console.log(`Vault: ${vaultDir}`);

    // Ensure vault structure
    await fs.mkdir(join(vaultDir, '_sources'), { recursive: true });

    console.log('\n[Orchestrator] Starting pipeline...');

    // Use code steps - direct function execution!
    const result = await agent({})
        // Step 1: Ingest
        .then({
            code: async () => {
                return await ingest({ sourcePath, vaultDir });
            },
            name: 'ingest'
        })
        // Step 2: Chunk (uses sourceId from step 1)
        .then({
            code: async (history) => {
                const prev = history[history.length - 1];
                const prevResult = JSON.parse(prev.mcp!.result.content[0].text);
                return await chunk({ sourceId: prevResult.sourceId, vaultDir });
            },
            name: 'chunk'
        })
        .run((step, idx) => {
            console.log(`\n[Step ${idx + 1}] ${step.mcp?.tool}`);
            if (step.mcp) {
                const result = JSON.parse(step.mcp.result.content[0].text);
                console.log(`  Success: ${result.success}`);
                if (result.sourceId) console.log(`  SourceId: ${result.sourceId}`);
                if (result.totalChunks) console.log(`  Chunks: ${result.totalChunks}`);
            }
            console.log(`  Duration: ${step.durationMs}ms`);
        });

    console.log('\n✅ Pipeline complete (0 LLM tokens, 0 MCP overhead!)');
    return result;
}
