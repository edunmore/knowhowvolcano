/**
 * Test Volcano Patterns with Subagents
 * 
 * Testing: branch, switch, forEach, while with code steps and subagents
 */

import { agent, StepResult } from 'volcano-sdk';

// ============================================================
// PATTERN 1: Branch with Code Steps
// ============================================================
async function testBranchWithCode() {
    console.log('\n=== PATTERN 1: Branch with Code Steps ===\n');

    const successAgent = agent({ name: 'success-handler' })
        .then({
            code: async () => ({ status: 'handled-success', message: 'All good!' }),
            name: 'handle-success'
        });

    const failureAgent = agent({ name: 'failure-handler' })
        .then({
            code: async () => ({ status: 'handled-failure', message: 'Something went wrong' }),
            name: 'handle-failure'
        });

    const result = await agent({ name: 'branch-test' })
        // Step 1: Simulate a check (code step)
        .then({
            code: async () => {
                const isSuccess = Math.random() > 0.5;
                return { success: isSuccess };
            },
            name: 'check-status'
        })
        // Step 2: Branch based on result
        .branch(
            (history) => {
                const lastResult = JSON.parse(history[history.length - 1].mcp!.result.content[0].text);
                return lastResult.success;
            },
            {
                true: (a) => a.runAgent(successAgent),
                false: (a) => a.runAgent(failureAgent)
            }
        )
        .run();

    console.log('Result:', result.length, 'steps');
    return result;
}

// ============================================================
// PATTERN 2: Switch with Code Steps
// ============================================================
async function testSwitchWithCode() {
    console.log('\n=== PATTERN 2: Switch with Code Steps ===\n');

    const highPriorityAgent = agent({ name: 'high-priority' })
        .then({
            code: async () => ({ action: 'escalate', priority: 'HIGH' }),
            name: 'escalate'
        });

    const mediumPriorityAgent = agent({ name: 'medium-priority' })
        .then({
            code: async () => ({ action: 'schedule', priority: 'MEDIUM' }),
            name: 'schedule'
        });

    const lowPriorityAgent = agent({ name: 'low-priority' })
        .then({
            code: async () => ({ action: 'queue', priority: 'LOW' }),
            name: 'queue'
        });

    const result = await agent({ name: 'switch-test' })
        // Step 1: Determine priority
        .then({
            code: async () => {
                const priorities = ['HIGH', 'MEDIUM', 'LOW'];
                return { priority: priorities[Math.floor(Math.random() * 3)] };
            },
            name: 'classify-priority'
        })
        // Step 2: Switch based on priority
        .switch(
            (history) => {
                const lastResult = JSON.parse(history[history.length - 1].mcp!.result.content[0].text);
                return lastResult.priority;
            },
            {
                HIGH: (a) => a.runAgent(highPriorityAgent),
                MEDIUM: (a) => a.runAgent(mediumPriorityAgent),
                LOW: (a) => a.runAgent(lowPriorityAgent),
                default: (a) => a.then({ code: async () => ({ action: 'unknown' }), name: 'unknown' })
            }
        )
        .run();

    console.log('Result:', result.length, 'steps');
    return result;
}

// ============================================================
// PATTERN 3: forEach with Code Steps
// ============================================================
async function testForEachWithCode() {
    console.log('\n=== PATTERN 3: forEach with Code Steps ===\n');

    const items = ['item-1', 'item-2', 'item-3'];

    const result = await agent({ name: 'foreach-test' })
        .forEach(
            items,
            (item, a) => a.then({
                code: async () => {
                    return { processed: item, timestamp: Date.now() };
                },
                name: `process-${item}`
            })
        )
        .then({
            code: async (history) => {
                return { totalProcessed: history.length };
            },
            name: 'summarize'
        })
        .run();

    console.log('Result:', result.length, 'steps');
    return result;
}

// ============================================================
// PATTERN 4: forEach with Subagents
// ============================================================
async function testForEachWithSubagents() {
    console.log('\n=== PATTERN 4: forEach with Subagents ===\n');

    const items = ['doc-1', 'doc-2'];

    // Define a reusable processing agent
    function createProcessAgent(itemId: string) {
        return agent({ name: `process-${itemId}` })
            .then({
                code: async () => ({ step: 'validate', item: itemId }),
                name: 'validate'
            })
            .then({
                code: async () => ({ step: 'transform', item: itemId }),
                name: 'transform'
            });
    }

    const result = await agent({ name: 'foreach-subagent-test' })
        .forEach(
            items,
            (item, a) => a.runAgent(createProcessAgent(item))
        )
        .run();

    console.log('Result:', result.length, 'steps');
    return result;
}

// ============================================================
// PATTERN 5: While Loop with Code Steps
// ============================================================
async function testWhileWithCode() {
    console.log('\n=== PATTERN 5: While Loop with Code Steps ===\n');

    let counter = 0;

    const result = await agent({ name: 'while-test' })
        .while(
            (history) => {
                if (history.length === 0) return true;
                const lastResult = JSON.parse(history[history.length - 1].mcp!.result.content[0].text);
                return lastResult.counter < 3;
            },
            (a) => a.then({
                code: async () => {
                    counter++;
                    return { counter, message: `Iteration ${counter}` };
                },
                name: 'iterate'
            }),
            { maxIterations: 5 }
        )
        .run();

    console.log('Result:', result.length, 'steps');
    return result;
}

// ============================================================
// RUN ALL TESTS
// ============================================================
console.log('🧪 Testing Volcano Patterns with Subagents\n');

await testBranchWithCode();
await testSwitchWithCode();
await testForEachWithCode();
await testForEachWithSubagents();
await testWhileWithCode();

console.log('\n✅ All pattern tests complete!');
