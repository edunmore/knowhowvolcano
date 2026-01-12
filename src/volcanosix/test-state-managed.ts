/**
 * Test State-Managed Runbook Pattern
 * 
 * Use code to track state, LLM only for decision-making.
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureProvider as createDeepSeek } from '../core/providers/azure-deepseek-provider.js';

const llm = createDeepSeek({ maxTokens: 200, temperature: 0.1 });

// Track state outside
let tasksCompleted = {
    step1: false,
    step2: false,
    step3: false
};

// Simple agents
const step1Agent = agent({ llm, name: 'step1', description: 'Executes step 1' })
    .then({
        code: async () => {
            tasksCompleted.step1 = true;
            return { result: 'Step 1 done', state: tasksCompleted };
        },
        name: 'execute'
    })
    .then({
        prompt: 'Confirm: Step 1 complete.',
        llm
    });

const step2Agent = agent({ llm, name: 'step2', description: 'Executes step 2' })
    .then({
        code: async () => {
            tasksCompleted.step2 = true;
            return { result: 'Step 2 done', state: tasksCompleted };
        },
        name: 'execute'
    })
    .then({
        prompt: 'Confirm: Step 2 complete.',
        llm
    });

const step3Agent = agent({ llm, name: 'step3', description: 'Executes step 3' })
    .then({
        code: async () => {
            tasksCompleted.step3 = true;
            return { result: 'Step 3 done', state: tasksCompleted };
        },
        name: 'execute'
    })
    .then({
        prompt: 'Confirm: Step 3 complete.',
        llm
    });

async function testStateManaged() {
    console.log('\n=== State-Managed Runbook ===\n');

    // Reset state
    tasksCompleted = { step1: false, step2: false, step3: false };

    try {
        const result = await agent({ llm, name: 'coordinator' })
            .then({
                code: async () => {
                    // Check current state, return next task
                    if (!tasksCompleted.step1) return { nextTask: 'step1', reason: 'Step 1 not done' };
                    if (!tasksCompleted.step2) return { nextTask: 'step2', reason: 'Step 2 not done' };
                    if (!tasksCompleted.step3) return { nextTask: 'step3', reason: 'Step 3 not done' };
                    return { nextTask: 'done', reason: 'All complete' };
                },
                name: 'check-state'
            })
            .then({
                prompt: `Based on state check, determine which agent to use:
                
If nextTask is "step1", respond: USE step1: execute step 1
If nextTask is "step2", respond: USE step2: execute step 2  
If nextTask is "step3", respond: USE step3: execute step 3
If nextTask is "done", respond: DONE: All tasks complete

Check the previous step result and respond accordingly.`,
                agents: [step1Agent, step2Agent, step3Agent]
            })
            .run();

        console.log('\n=== Results ===');
        console.log('Final state:', tasksCompleted);
        console.log('Steps executed:', result.length);

        return result;
    } catch (e) {
        console.error('Error:', e);
    }
}

console.log('🧪 Testing State-Managed Pattern\n');
await testStateManaged();
console.log('\n✅ Test complete!');
console.log('Final state:', tasksCompleted);
