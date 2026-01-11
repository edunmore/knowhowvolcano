/**
 * Quick test for Azure DeepSeek provider
 */

import { agent } from 'volcano-sdk';
import { createAzureProvider } from './providers/azure-deepseek-provider.js';

async function testAzureProvider() {
    console.log('\n=== Testing Azure DeepSeek-V3.2 Provider ===\n');

    try {
        const llm = createAzureProvider();
        console.log('✅ Provider created successfully');

        console.log('\n📝 Running simple generation test...\n');

        const results = await agent({ llm })
            .then({ prompt: 'What is 2+2? Reply with just the number.' })
            .run();

        console.log(`Response: ${results[0]?.llmOutput}`);
        console.log('\n🎉 Azure DeepSeek provider is working!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testAzureProvider();
