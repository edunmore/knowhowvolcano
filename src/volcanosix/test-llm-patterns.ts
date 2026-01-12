/**
 * Test Volcano Patterns - LLM Mixed with Code Steps
 * 
 * Testing: LLM decides, code executes
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureGPT5Nano } from '../core/providers/azure-gpt5-nano-provider.js';

const llm = createAzureGPT5Nano({ maxTokens: 100 });

// ============================================================
// PATTERN 1: LLM Classifies, Code Executes Branch
// ============================================================
async function testLLMBranch() {
    console.log('\n=== LLM Branch: LLM classifies, code executes ===\n');

    const processPositive = agent({ name: 'positive-handler' })
        .then({
            code: async () => ({ sentiment: 'positive', action: 'celebrate' }),
            name: 'handle-positive'
        });

    const processNegative = agent({ name: 'negative-handler' })
        .then({
            code: async () => ({ sentiment: 'negative', action: 'investigate' }),
            name: 'handle-negative'
        });

    const result = await agent({ llm, name: 'sentiment-analyzer' })
        // Step 1: LLM classifies
        .then({
            prompt: 'Classify this text as POSITIVE or NEGATIVE. Reply with only the word: "The product exceeded my expectations!"',
            name: 'classify'
        })
        // Step 2: Branch based on LLM output
        .branch(
            (history) => {
                const output = history[history.length - 1].llmOutput || '';
                return output.toUpperCase().includes('POSITIVE');
            },
            {
                true: (a) => a.runAgent(processPositive),
                false: (a) => a.runAgent(processNegative)
            }
        )
        .run();

    console.log('Steps:', result.length);
    console.log('LLM said:', result[0]?.llmOutput);
    return result;
}

// ============================================================
// PATTERN 2: LLM Decides Priority, Code Routes
// ============================================================
async function testLLMSwitch() {
    console.log('\n=== LLM Switch: LLM prioritizes, code routes ===\n');

    const urgentHandler = agent({ name: 'urgent' })
        .then({
            code: async () => ({ priority: 'urgent', action: 'page-oncall' }),
            name: 'alert'
        });

    const normalHandler = agent({ name: 'normal' })
        .then({
            code: async () => ({ priority: 'normal', action: 'create-ticket' }),
            name: 'ticket'
        });

    const result = await agent({ llm, name: 'priority-router' })
        // Step 1: LLM classifies priority
        .then({
            prompt: 'Classify this issue priority as URGENT, NORMAL, or LOW. Reply with only one word: "Server is completely down, customers cannot access service"',
            name: 'classify-priority'
        })
        // Step 2: Switch based on LLM output
        .switch(
            (history) => {
                const output = (history[history.length - 1].llmOutput || '').toUpperCase().trim();
                if (output.includes('URGENT')) return 'URGENT';
                if (output.includes('NORMAL')) return 'NORMAL';
                return 'LOW';
            },
            {
                URGENT: (a) => a.runAgent(urgentHandler),
                NORMAL: (a) => a.runAgent(normalHandler),
                LOW: (a) => a.then({ code: async () => ({ priority: 'low', action: 'queue' }), name: 'queue' }),
                default: (a) => a.then({ code: async () => ({ priority: 'unknown' }), name: 'unknown' })
            }
        )
        .run();

    console.log('Steps:', result.length);
    console.log('LLM said:', result[0]?.llmOutput);
    return result;
}

// ============================================================
// PATTERN 3: LLM Generates Items, Code Processes Each
// ============================================================
async function testLLMForEach() {
    console.log('\n=== LLM forEach: LLM generates, code processes ===\n');

    // First get items from LLM, then process with code
    const items = ['apple', 'banana', 'cherry']; // In real case, LLM would generate these

    const result = await agent({ llm, name: 'item-processor' })
        // Step 1: LLM explains what we'll do
        .then({
            prompt: `I have these items: ${items.join(', ')}. Say "Processing items" and nothing else.`,
            name: 'intro'
        })
        // Step 2: forEach with code
        .forEach(
            items,
            (item, a) => a.then({
                code: async () => ({ item, processed: true, length: item.length }),
                name: `process-${item}`
            })
        )
        .run();

    console.log('Steps:', result.length);
    return result;
}

// ============================================================
// RUN ALL LLM TESTS
// ============================================================
console.log('🧪 Testing LLM + Code Patterns\n');

await testLLMBranch();
await testLLMSwitch();
await testLLMForEach();

console.log('\n✅ All LLM pattern tests complete!');
