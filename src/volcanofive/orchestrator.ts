/**
 * Orchestrator Agent
 * 
 * Uses mcpStdio to connect to pipeline tools MCP server.
 * LLM decides which tools to call based on runbook.
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createAzureGPT5Nano } from '../core/providers/azure-gpt5-nano-provider.js';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Run the extraction pipeline
 */
export async function runPipeline(sourcePath: string, vaultDir: string) {
    console.log('🌋 volcanofive - MCP Pipeline');
    console.log(`Source: ${sourcePath}`);
    console.log(`Vault: ${vaultDir}`);

    // Ensure vault structure
    await fs.mkdir(join(vaultDir, '_sources'), { recursive: true });
    await fs.mkdir(join(vaultDir, '_system', 'runbooks'), { recursive: true });

    // Load runbook
    let runbook: string;
    const runbookPath = join(vaultDir, '_system', 'runbooks', 'extraction.md');
    try {
        runbook = await fs.readFile(runbookPath, 'utf-8');
    } catch {
        // Create default runbook
        runbook = `# Extraction Pipeline

1. Ingest the source file
2. Chunk the document into smaller pieces
`;
        await fs.writeFile(runbookPath, runbook, 'utf-8');
    }

    // Connect to MCP server via stdio
    const pipelineTools = mcpStdio({
        command: 'npx',
        args: ['tsx', resolve('src/volcanofive/mcp-server/index.ts')],
        env: {}
    });

    console.log('\n[Orchestrator] Connected to MCP server');
    console.log('[Orchestrator] Available tools: ingest, chunk');

    // Test with GPT-5-nano
    const llm = createAzureGPT5Nano({ maxTokens: 500 });
    // For testing: const { dummyLLM } = await import('./providers/dummy-llm.js');
    // const llm = dummyLLM();

    const result = await agent({ llm, name: 'orchestrator' })
        // Use automatic tool selection
        .then({
            prompt: `You are a pipeline executor. Execute these steps:

SOURCE FILE: ${sourcePath}
VAULT DIR: ${vaultDir}

1. Call 'ingest' with sourcePath and vaultDir
2. Then call 'chunk' with the returned sourceId and vaultDir`,
            mcps: [pipelineTools],
            maxToolIterations: 3
        })
        .run((step, idx) => {
            console.log(`\n[Step ${idx + 1}]`);
            if (step.toolCalls && step.toolCalls.length > 0) {
                for (const call of step.toolCalls) {
                    console.log(`  Tool called: ${call.name}`);
                    console.log(`  Result: ${JSON.stringify(call.result).slice(0, 300)}`);
                }
            } else {
                console.log('  No tool calls');
            }
            if (step.llmOutput) {
                console.log(`  LLM: ${step.llmOutput.slice(0, 200)}`);
            }
        });

    // Cleanup MCP server
    await pipelineTools.cleanup?.();

    console.log('\n✅ Pipeline complete');
    return result;
}

