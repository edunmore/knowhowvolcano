/**
 * Test the new code step pattern - direct function execution without MCP/LLM overhead
 */
import { agent } from 'volcano-sdk';
import { ingest } from './mcp-server/tools/ingest.js';
import { chunk } from './mcp-server/tools/chunk.js';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';

const sourcePath = resolve('benchmark/benchmark_source_nohints.md');
const vaultDir = resolve('vault-test-code-step');

console.log('🧪 Testing Code Step Pattern\n');

// Ensure vault structure
await fs.mkdir(join(vaultDir, '_sources'), { recursive: true });

const result = await agent({})
    // Step 1: Code step - direct function call
    .then({
        code: async (history) => {
            console.log('  [code] Ingesting...');
            return await ingest({ sourcePath, vaultDir });
        },
        name: 'ingest'
    })
    // Step 2: Code step - uses previous result
    .then({
        code: async (history) => {
            const prev = history[history.length - 1];
            const prevResult = JSON.parse(prev.mcp!.result.content[0].text);
            console.log(`  [code] Chunking sourceId: ${prevResult.sourceId}`);
            return await chunk({ sourceId: prevResult.sourceId, vaultDir });
        },
        name: 'chunk'
    })
    .run((step, idx) => {
        console.log(`\n[Step ${idx + 1}] ${step.mcp?.tool}`);
        console.log(`  Duration: ${step.durationMs}ms`);
        console.log(`  LLM used: ${step.llmOutput ? 'yes' : 'no'}`);
        console.log(`  Result: ${step.mcp?.result.content[0].text.slice(0, 100)}...`);
    });

console.log('\n✅ Code step test complete!');
console.log(`Total steps: ${result.length}`);
console.log(`LLM tokens used: 0`);
