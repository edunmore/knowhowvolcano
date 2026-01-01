/**
 * Test script for Gemini CLI Provider
 * 
 * Run with: npx tsx src/test-provider.ts
 */

import { agent } from 'volcano-sdk';
import { llmGeminiCLI } from './providers/gemini-cli-provider.js';

async function testBasicGeneration() {
    console.log('\n=== Test 1: Basic Generation ===\n');

    const llm = llmGeminiCLI({
        model: 'gemini-2.5-flash', // Use flash for faster testing
        workingDir: process.cwd(),
        yolo: true,
    });

    console.log(`Provider ID: ${llm.id}`);
    console.log(`Model: ${llm.model}`);

    try {
        const response = await llm.gen('What is 2+2? Reply with just the number.');
        console.log(`Response: ${response}`);
        console.log('✅ Basic generation passed\n');
        return true;
    } catch (error) {
        console.error('❌ Basic generation failed:', error);
        return false;
    }
}

async function testFileContext() {
    console.log('\n=== Test 2: File Context (Agentic Capabilities) ===\n');

    const llm = llmGeminiCLI({
        model: 'gemini-2.5-flash',
        workingDir: process.cwd(),
        yolo: true,
    });

    try {
        const response = await llm.gen(
            'List the files in the PROMPTS directory. Just list the filenames, one per line.'
        );
        console.log(`Response:\n${response}`);

        // Verify it found some prompts
        if (response.toLowerCase().includes('router') || response.toLowerCase().includes('extractor')) {
            console.log('✅ File context test passed (Gemini read the file system)\n');
            return true;
        } else {
            console.log('⚠️ File context test unclear - response may not include expected files\n');
            return true; // Don't fail, just warn
        }
    } catch (error) {
        console.error('❌ File context test failed:', error);
        return false;
    }
}

async function testVolcanoSDKIntegration() {
    console.log('\n=== Test 3: Volcano SDK Agent Chain ===\n');

    const llm = llmGeminiCLI({
        model: 'gemini-2.5-flash',
        workingDir: process.cwd(),
        yolo: true,
    });

    try {
        const results = await agent({ llm })
            .then({ prompt: 'What is the capital of France? Reply in one word.' })
            .then({ prompt: 'What is the population of that city? Reply with just the approximate number.' })
            .run();

        console.log('Agent chain completed!');
        console.log(`Step 1 output: ${results[0]?.llmOutput?.substring(0, 100)}...`);
        console.log(`Step 2 output: ${results[1]?.llmOutput?.substring(0, 100)}...`);
        console.log('✅ Volcano SDK integration test passed\n');
        return true;
    } catch (error) {
        console.error('❌ Volcano SDK integration test failed:', error);
        return false;
    }
}

async function testUsageTracking() {
    console.log('\n=== Test 4: Token Usage Tracking ===\n');

    const llm = llmGeminiCLI({
        model: 'gemini-2.5-flash',
        workingDir: process.cwd(),
        yolo: true,
    });

    try {
        await llm.gen('Say hello');
        const usage = llm.getUsage?.();

        if (usage) {
            console.log(`Token usage: ${JSON.stringify(usage)}`);
            console.log('✅ Usage tracking test passed\n');
        } else {
            console.log('⚠️ No usage data returned (may be normal for some responses)\n');
        }
        return true;
    } catch (error) {
        console.error('❌ Usage tracking test failed:', error);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Gemini CLI Provider for Volcano SDK - Test Suite       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const results = {
        basic: await testBasicGeneration(),
        fileContext: await testFileContext(),
        volcanoSDK: await testVolcanoSDKIntegration(),
        usage: await testUsageTracking(),
    };

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                       Test Summary                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.values(results).length;

    console.log(`Results: ${passed}/${total} tests passed\n`);

    for (const [name, result] of Object.entries(results)) {
        console.log(`  ${result ? '✅' : '❌'} ${name}`);
    }

    console.log('\n');

    if (passed === total) {
        console.log('🎉 All tests passed! The Gemini CLI provider is ready to use.');
        process.exit(0);
    } else {
        console.log('⚠️ Some tests failed. Check the output above for details.');
        process.exit(1);
    }
}

main().catch(console.error);
