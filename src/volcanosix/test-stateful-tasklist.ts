/**
 * Test Stateful Task List Pattern
 * 
 * Coordinator maintains a task list and updates it after each completion.
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureProvider as createDeepSeek } from '../core/providers/azure-deepseek-provider.js';

const llm = createDeepSeek({ maxTokens: 400, temperature: 0.1, debug: true });

// Agents with meaningful descriptions for coordinator
const step1Agent = agent({
    name: 'Ingest',
    description: 'Step 1'
})
    .then({
        code: async () => ({
            result: { files: 5, bytes: 1024 },
            message: 'Completed: Ingested 5 files (1KB)'
        })
    });

const step2Agent = agent({
    name: 'Chunk',
    description: 'Step 2'
})
    .then({
        code: async () => ({
            result: { chunks: 42 },
            message: 'Completed: Created 42 chunks'
        })
    });

const step3Agent = agent({
    name: 'Sleep',
    description: 'Step 3'
})
    .then({
        code: async () => ({
            result: { slept: '5s' },
            message: 'Completed: Slept for 5 seconds'
        })
    });

async function testStatefulTaskList() {
    console.log('\n=== Stateful Task List Pattern ===\n');

    try {
        const result = await agent({ llm, name: 'coordinator' })
            .then({
                prompt: `
You are runbook executor:

Execute the following steps in order:

1. Ingest
2. Chunk
3. Sleep

`,
                agents: [step1Agent, step2Agent, step3Agent]
            })
            .run();

        console.log('\n=== Results ===');
        console.log('Steps:', result.length);
        result.forEach((step, i) => {
            console.log(`\nStep ${i + 1}:`);
            if (step.llmOutput) {
                console.log('  LLM:', step.llmOutput.slice(0, 300));
            }
        });

        return result;
    } catch (e) {
        console.error('Error:', e);
    }
}

console.log('🧪 Testing Stateful Task List Pattern\n');
await testStatefulTaskList();
console.log('\n✅ Test complete!');
