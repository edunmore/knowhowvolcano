/**
 * Simple test of MCP filesystem with DeepSeek
 * To verify tool calling works
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createAzureProvider } from './core/providers/azure-deepseek-provider.js';

async function testDeepSeekWithMCP() {
    console.log('\n=== Testing DeepSeek with MCP Filesystem ===\n');

    const testDir = process.cwd() + '/test-vault';

    // Start MCP filesystem server
    const filesystem = mcpStdio({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', testDir],
    });

    try {
        // List available tools
        const tools = await filesystem.listTools();
        console.log('📂 MCP Tools available:');
        tools.tools.forEach(t => console.log(`   - ${t.name}`));
        console.log('');

        // Create DeepSeek provider
        const llm = createAzureProvider();
        console.log('✅ DeepSeek provider created\n');

        // Simple test: Create a file
        console.log('📝 Asking DeepSeek to create a test file...\n');

        const results = await agent({ llm })
            .then({
                prompt: `Create a file called "test-mcp-deepseek.txt" with the content "Hello from DeepSeek via MCP!". 
                
IMPORTANT: You MUST call the write_file tool to create this file. Do not just respond with text - actually call the tool.

After creating the file, confirm what you did.`,
                mcps: [filesystem],
            })
            .run();

        console.log('\n📄 Result:');
        console.log('LLM Output:', results[0]?.llmOutput?.slice(0, 300));
        console.log('Tool Calls:', results[0]?.toolCalls?.length || 0);

        if (results[0]?.toolCalls && results[0].toolCalls.length > 0) {
            console.log('Tools Called:');
            results[0].toolCalls.forEach(tc => {
                console.log(`  - ${tc.name}(${JSON.stringify(tc.arguments).slice(0, 100)}...)`);
            });
        }

        console.log('\n🎉 Test complete!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await filesystem.cleanup?.();
        console.log('🧹 Cleaned up MCP server');
    }
}

testDeepSeekWithMCP();
