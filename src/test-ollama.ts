/**
 * Quick test for Ollama local provider
 */

import { agent } from 'volcano-sdk';
import { createOllamaProvider } from './providers/ollama-provider.js';

async function testOllamaProvider() {
    console.log('\n=== Testing Ollama qwen3:8b Local Provider ===\n');

    try {
        const llm = createOllamaProvider();
        console.log('✅ Provider created successfully');

        console.log('\n📝 Running simple generation test...\n');

        const results = await agent({ llm })
            .then({ prompt: 'What is 2+2? Reply with just the number, no explanation.' })
            .run();

        console.log(`Response: ${results[0]?.llmOutput}`);
        console.log('\n🎉 Ollama provider is working!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testOllamaProvider();
