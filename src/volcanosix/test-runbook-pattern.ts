/**
 * Test Runbook-Driven Multi-Agent Pattern
 * 
 * Give the coordinator a task list (runbook) to execute sequentially.
 * More deterministic than autonomous decision-making.
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureProvider as createDeepSeek } from '../core/providers/azure-deepseek-provider.js';

const llm = createDeepSeek({ maxTokens: 300, temperature: 0.1 });

// ============================================================
// Define agents
// ============================================================
const analyzerAgent = agent({
    llm,
    name: 'analyzer',
    description: 'Analyzes input text and extracts key information'
})
    .then({
        code: async (history: StepResult[]) => {
            return {
                analysis: 'Text contains greeting to Volcano SDK',
                keywords: ['hello', 'volcano', 'sdk'],
                sentiment: 'positive'
            };
        },
        name: 'analyze'
    })
    .then({
        prompt: 'Report: Analysis complete. Keywords: hello, volcano, sdk. Sentiment: positive.',
        llm,
        name: 'report'
    });

const summarizerAgent = agent({
    llm,
    name: 'summarizer',
    description: 'Creates concise summaries'
})
    .then({
        code: async (history: StepResult[]) => {
            return {
                summary: 'A friendly greeting message to the Volcano SDK project.',
                wordCount: 4
            };
        },
        name: 'summarize'
    })
    .then({
        prompt: 'Report: Summary created - A friendly greeting message to the Volcano SDK project.',
        llm,
        name: 'report'
    });

// ============================================================
// Test Runbook-Driven Execution
// ============================================================
async function testRunbookPattern() {
    console.log('\n=== Runbook-Driven Multi-Agent Pattern ===\n');

    try {
        const result = await agent({ llm, name: 'coordinator' })
            .then({
                prompt: `You are executing a runbook. Process this text: "Hello Volcano SDK!"

RUNBOOK (execute in order):
1. [ ] Analyze text - Use analyzer agent
2. [ ] Summarize findings - Use summarizer agent

INSTRUCTIONS:
- Execute ONE task at a time
- After task completes, mark it [x] and move to next
- When ALL tasks are [x], respond with: DONE: brief summary of what was accomplished

FORMAT:
USE analyzer: analyze the text and extract information
(wait for result)
USE summarizer: create a summary based on the analysis
(wait for result)
DONE: Completed analysis and summary of the greeting message

Start with task 1. Use EXACT format above.`,
                agents: [analyzerAgent, summarizerAgent]
            })
            .run();

        console.log('\n=== Results ===');
        console.log('Steps:', result.length);
        result.forEach((step, i) => {
            console.log(`\nStep ${i + 1}:`);
            if (step.llmOutput) console.log('  LLM:', step.llmOutput.slice(0, 200));
            if (step.mcp) console.log('  Code:', step.mcp.tool, '→', JSON.stringify(JSON.parse(step.mcp.result.content[0].text)).slice(0, 100));
        });

        return result;
    } catch (e) {
        console.error('Error:', e);
    }
}

console.log('🧪 Testing Runbook-Driven Pattern\n');
await testRunbookPattern();
console.log('\n✅ Test complete!');
