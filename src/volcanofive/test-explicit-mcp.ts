/**
 * Test: Explicit MCP Tool Call Pattern
 * 
 * Does { mcp, tool, args } bypass LLM entirely?
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { resolve } from 'node:path';
import * as fs from 'node:fs/promises';

async function testExplicitToolCall() {
    console.log('🧪 Testing Explicit MCP Tool Call Pattern\n');

    // Setup vault
    const vaultDir = resolve('./vault-test-explicit');
    await fs.mkdir(`${vaultDir}/_sources`, { recursive: true });

    // Connect to MCP server
    const pipelineTools = mcpStdio({
        command: 'npx',
        args: ['tsx', resolve('src/volcanofive/mcp-server/index.ts')],
        env: {}
    });

    console.log('Connected to MCP server');

    // No LLM specified - should still work with explicit tool call
    const result = await agent({})
        .then({
            mcp: pipelineTools,
            tool: 'ingest',
            args: {
                sourcePath: resolve('benchmark/benchmark_source_nohints.md'),
                vaultDir: vaultDir
            }
            // No prompt, no LLM - pure tool call
        })
        .run((step, idx) => {
            console.log(`\n[Step ${idx + 1}]`);
            if (step.mcp) {
                console.log('  MCP Tool:', step.mcp.tool);
                console.log('  Result:', JSON.stringify(step.mcp.result).slice(0, 200));
            }
            if (step.llmOutput) {
                console.log('  LLM Output:', step.llmOutput.slice(0, 100));
            }
            console.log('  Duration:', step.durationMs, 'ms');
        });

    // Cleanup
    await pipelineTools.cleanup?.();

    console.log('\n✅ Test complete');
    console.log('Total steps:', result.length);
    console.log('Has LLM output:', result.some(r => r.llmOutput));
    console.log('Has MCP result:', result.some(r => r.mcp));
}

testExplicitToolCall().catch(console.error);
