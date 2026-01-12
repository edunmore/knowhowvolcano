/**
 * Test Runbook Loop Pattern
 * 
 * Test if coordinator can loop on an agent until completion signal.
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureGPT5Nano } from '../core/providers/azure-gpt5-nano-provider.js';

const llm = createAzureGPT5Nano({ maxTokens: 400 });

// State tracking for chunk agent
let chunkCallCount = 0;

const ingestAgent = agent({
    name: 'Ingest',
    description: 'Ingest source files'
})
    .then({
        code: async () => ({
            result: { files: 5 },
            message: 'Completed: Ingested 5 files'
        })
    });

const chunkAgent = agent({
    name: 'Chunk',
    description: 'Chunk files into pieces (may need multiple attempts)'
})
    .then({
        code: async () => {
            chunkCallCount++;

            if (chunkCallCount < 3) {
                // Still working
                return {
                    result: { progress: `${chunkCallCount}/3` },
                    message: `Working on it... (attempt ${chunkCallCount}/3)`
                };
            } else {
                // Done!
                return {
                    result: { chunks: 42, attempts: chunkCallCount },
                    message: 'Completed: Created 42 chunks'
                };
            }
        }
    });

async function testLoopPattern() {
    console.log('\n=== Testing Loop Pattern ===\n');

    // Reset state
    chunkCallCount = 0;

    try {
        const result = await agent({ llm, name: 'coordinator' })
            .then({
                prompt: `
You are a runbook executor:

Execute the following steps in order:

1. Ingest - run once
2. Chunk - REPEAT until you see "Completed:" in the output
   - If output is "Working on it...", call Chunk again
   - If output is "Completed: Created XX chunks", move to next step or finish

`,
                agents: [ingestAgent, chunkAgent]
            })
            .run();

        console.log('\n=== Results ===');
        console.log('Chunk was called:', chunkCallCount, 'times');
        console.log('\nFinal output:', result[0].llmOutput);

        return result;
    } catch (e) {
        console.error('Error:', e);
    }
}

console.log('🧪 Testing Runbook Loop Pattern\n');
await testLoopPattern();
console.log('\n✅ Test complete!');
