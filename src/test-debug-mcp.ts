/**
 * Debug test for DeepSeek + MCP integration
 * Tests whether tool calls are properly parsed and executed
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createDeepSeekWithTools } from './core/providers/deepseek-tools-provider.js';

async function debugDeepSeekMCP() {
    console.log('\n=== Debug DeepSeek + MCP Tool Calls ===\n');

    const testDir = process.cwd() + '/test-vault';

    // Start MCP filesystem server
    const filesystem = mcpStdio({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', testDir],
    });

    try {
        // List available MCP tools
        const mcpTools = await filesystem.listTools();
        console.log('📂 MCP Tools:');
        mcpTools.tools.slice(0, 5).forEach(t => console.log(`   - ${t.name}`));
        console.log(`   ... and ${mcpTools.tools.length - 5} more\n`);

        // Create DeepSeek provider
        const llm = createDeepSeekWithTools();
        console.log('✅ DeepSeek provider created');
        console.log('   Model:', llm.model);
        console.log('   Has genWithTools:', typeof llm.genWithTools === 'function');
        console.log('');

        // Create a simple test prompt that should trigger file creation
        // Use ABSOLUTE path within the allowed directory
        const testFile = `${testDir}/test-debug-${Date.now()}.txt`;
        const testPrompt = `Create a file at the ABSOLUTE path "${testFile}" with the content "Test from DeepSeek MCP debug".

You have access to the write_file tool. Use it now with the path: ${testFile}`;

        console.log('📝 Sending prompt to LLM...');
        console.log(`   Target file: ${testFile}\n`);

        // Run through Volcano agent with MCP
        const results = await agent({ llm, timeout: 60 })
            .then({
                prompt: testPrompt,
                mcps: [filesystem],
            })
            .run();

        console.log('\n📊 Results:');
        console.log('   Steps:', results.length);

        const step = results[0];
        console.log('   LLM Output length:', step?.llmOutput?.length || 0);
        console.log('   Tool Calls:', step?.toolCalls?.length || 0);

        if (step?.toolCalls && step.toolCalls.length > 0) {
            console.log('\n🔧 Tool Calls Made:');
            step.toolCalls.forEach((tc: any, i: number) => {
                console.log(`   ${i + 1}. ${tc.name}`);
                console.log(`      Args: ${JSON.stringify(tc.arguments).slice(0, 100)}`);
                console.log(`      Result: ${tc.result?.slice(0, 100) || 'no result'}`);
            });
        } else {
            console.log('\n⚠️ No tool calls detected by Volcano SDK');
            console.log('\n📄 LLM Raw Output:');
            console.log(step?.llmOutput?.slice(0, 500));
        }

        // Check if the file was created
        const fs = await import('node:fs/promises');
        const files = await fs.readdir(testDir).catch(() => []);
        const testFiles = files.filter((f: string) => f.startsWith('test-debug-'));
        console.log('\n📁 Test files in vault:', testFiles);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await filesystem.cleanup?.();
        console.log('\n🧹 Cleaned up MCP server');
    }
}

debugDeepSeekMCP();
