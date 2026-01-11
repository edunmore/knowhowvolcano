/**
 * Test MCP Filesystem Tools with Volcano SDK
 * 
 * Demonstrates how to give Azure/Ollama providers file system access
 * using MCP (Model Context Protocol) filesystem server.
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createOllamaProvider } from './providers/ollama-provider.js';

async function testMCPFilesystem() {
    console.log('\n=== Testing MCP Filesystem Tools with Ollama ===\n');

    // Start MCP filesystem server via stdio
    // This gives the LLM access to read/write files
    const filesystem = mcpStdio({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        // The server gets access to the current working directory
    });

    try {
        // List available tools from the MCP server
        const tools = await filesystem.listTools();
        console.log('📂 Available filesystem tools:');
        tools.tools.forEach(t => console.log(`   - ${t.name}: ${t.description?.slice(0, 60)}...`));
        console.log('');

        // Create LLM provider
        const llm = createOllamaProvider({ model: 'qwen3:8b' });
        console.log('✅ Ollama provider created');

        // Test: Ask the LLM to read a file using MCP tools
        console.log('\n📝 Asking LLM to read testfile.txt using MCP tools...\n');

        const results = await agent({ llm })
            .then({
                prompt: 'Read the file "testfile.txt" and tell me what it says. Use the available filesystem tools.',
                mcps: [filesystem],  // Provide MCP tools to the agent
            })
            .run();

        console.log('\n📄 LLM Response:');
        console.log(results[0]?.llmOutput);

        // Check if any tools were called
        const toolCalls = results[0]?.toolCalls || [];
        if (toolCalls.length > 0) {
            console.log('\n🔧 Tools called:');
            toolCalls.forEach(tc => console.log(`   - ${tc.name}(${JSON.stringify(tc.arguments)})`));
        }

        console.log('\n🎉 MCP filesystem test complete!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        // Important: Clean up the MCP server process
        await filesystem.cleanup?.();
        console.log('🧹 Cleaned up MCP server');
    }
}

testMCPFilesystem();
