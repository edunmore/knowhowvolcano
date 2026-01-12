/**
 * Orchestrator Agent
 * 
 * Uses mcpStdio to connect to pipeline tools MCP server.
 * Uses explicit tool calls (no LLM overhead for deterministic steps).
 */

import { agent, mcpStdio } from 'volcano-sdk';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Run the extraction pipeline using explicit MCP tool calls
 * 
 * No LLM needed for deterministic pipeline steps!
 */
export async function runPipeline(sourcePath: string, vaultDir: string) {
    console.log('🌋 volcanofive - MCP Pipeline (Explicit Tool Calls)');
    console.log(`Source: ${sourcePath}`);
    console.log(`Vault: ${vaultDir}`);

    // Ensure vault structure
    await fs.mkdir(join(vaultDir, '_sources'), { recursive: true });

    // Connect to MCP server via stdio
    const pipelineTools = mcpStdio({
        command: 'npx',
        args: ['tsx', resolve('src/volcanofive/mcp-server/index.ts')],
        env: {}
    });

    console.log('\n[Orchestrator] Connected to MCP server');

    // Use explicit tool calls - NO LLM for deterministic operations!
    const result = await agent({})
        // Step 1: Ingest (explicit call, no LLM)
        .then({
            mcp: pipelineTools,
            tool: 'ingest',
            args: { sourcePath, vaultDir }
        })
        // Step 2: Chunk (needs sourceId from step 1)
        // For now, we parse the result manually
        .run((step, idx) => {
            console.log(`\n[Step ${idx + 1}]`);
            if (step.mcp) {
                console.log(`  Tool: ${step.mcp.tool}`);
                console.log(`  Result: ${JSON.stringify(step.mcp.result).slice(0, 300)}`);
            }
            console.log(`  Duration: ${step.durationMs}ms`);
            console.log(`  LLM used: ${step.llmOutput ? 'yes' : 'no'}`);
        });

    // Extract sourceId from ingest result and call chunk
    const ingestResult = result[0]?.mcp?.result;
    let sourceId: string | undefined;

    if (ingestResult?.content?.[0]?.text) {
        const parsed = JSON.parse(ingestResult.content[0].text);
        sourceId = parsed.sourceId;
    }

    if (sourceId) {
        console.log(`\n[Orchestrator] Chunking sourceId: ${sourceId}`);

        const chunkResult = await agent({})
            .then({
                mcp: pipelineTools,
                tool: 'chunk',
                args: { sourceId, vaultDir }
            })
            .run((step) => {
                if (step.mcp) {
                    console.log(`  Tool: ${step.mcp.tool}`);
                    console.log(`  Result: ${JSON.stringify(step.mcp.result).slice(0, 300)}`);
                }
            });
    }

    // Cleanup MCP server
    await pipelineTools.cleanup?.();

    console.log('\n✅ Pipeline complete (no LLM tokens used!)');
    return result;
}
