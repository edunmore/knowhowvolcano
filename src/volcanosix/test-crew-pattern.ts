/**
 * Test Autonomous Multi-Agent Crew Pattern
 * 
 * The LLM must respond with exact format: "USE agent-name: task" or "DONE: answer"
 */

import { agent, StepResult } from 'volcano-sdk';
import { createAzureProvider as createDeepSeek } from '../core/providers/azure-deepseek-provider.js';

const llm = createDeepSeek({ maxTokens: 500, temperature: 0.3 });

// ============================================================
// Define agents with name and description (required for crews)
// ============================================================
const analyzerAgent = agent({
    llm,
    name: 'analyzer',
    description: 'Analyzes input text and extracts key information'
})
    .then({
        code: async (history: StepResult[]) => {
            // Simulate analysis
            return { analysis: 'Text analyzed successfully', keywords: ['test', 'volcano'] };
        },
        name: 'analyze'
    });

const summarizerAgent = agent({
    llm,
    name: 'summarizer',
    description: 'Creates concise summaries of analyzed content'
})
    .then({
        code: async (history: StepResult[]) => {
            return { summary: 'This is a test of the Volcano SDK crew pattern.' };
        },
        name: 'summarize'
    });

// ============================================================
// Test Multi-Agent Crew
// ============================================================
async function testCrewPattern() {
    console.log('\n=== Multi-Agent Crew Pattern ===\n');
    console.log('Required LLM response format: "USE agent-name: task" or "DONE: answer"\n');

    try {
        const result = await agent({ llm, name: 'coordinator' })
            .then({
                prompt: `You are a coordinator. You have these agents available:
- analyzer: Analyzes input text and extracts key information  
- summarizer: Creates concise summaries of analyzed content

Your task: Process this text: "Hello Volcano SDK!"

You MUST respond in this EXACT format:
USE analyzer: analyze the text to extract information

After each agent completes, decide what to do next. When done, respond:
DONE: your final summary

Start now by using the analyzer agent.`,
                agents: [analyzerAgent, summarizerAgent]
            })
            .run();

        console.log('\n=== Results ===');
        console.log('Steps:', result.length);
        result.forEach((step, i) => {
            console.log(`Step ${i + 1}:`, step.llmOutput?.slice(0, 100) || step.mcp?.tool || '(no output)');
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

console.log('🧪 Testing Multi-Agent Crew Pattern\n');
await testCrewPattern();
console.log('\n✅ Test complete!');
