/**
 * Test MCP Filesystem Tools with Azure DeepSeek
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createAzureProvider } from './providers/azure-deepseek-provider.js';

async function testMCPWithAzure() {
    console.log('\n=== Testing MCP Filesystem Tools with Azure DeepSeek ===\n');

    const filesystem = mcpStdio({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    });

    try {
        const tools = await filesystem.listTools();
        console.log(`📂 ${tools.tools.length} filesystem tools available`);

        const llm = createAzureProvider();
        console.log('✅ Azure DeepSeek provider created');

        console.log('\n📝 Asking DeepSeek to read testfile.txt...\n');

        const results = await agent({ llm })
            .then({
                prompt: 'Read the file "testfile.txt" and tell me what it says.',
                mcps: [filesystem],
            })
            .run();

        console.log('\n📄 LLM Response:');
        console.log(results[0]?.llmOutput);

        const toolCalls = results[0]?.toolCalls || [];
        if (toolCalls.length > 0) {
            console.log('\n🔧 Tools called:');
            toolCalls.forEach(tc => console.log(`   - ${tc.name}(${JSON.stringify(tc.arguments)})`));
        }

        console.log('\n🎉 Azure DeepSeek MCP test complete!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await filesystem.cleanup?.();
    }
}

testMCPWithAzure();
