/**
 * Test DeepSeek with tool calling support
 */

import { agent, mcpStdio } from 'volcano-sdk';
import { createDeepSeekWithTools } from './providers/deepseek-tools-provider.js';

async function testDeepSeekTools() {
    console.log('\n=== Testing DeepSeek V3.2 with MCP Tools ===\n');

    const filesystem = mcpStdio({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    });

    try {
        const tools = await filesystem.listTools();
        console.log(`📂 ${tools.tools.length} filesystem tools available`);

        const llm = createDeepSeekWithTools();
        console.log('✅ DeepSeek provider with tool support created');

        console.log('\n📝 Asking DeepSeek to read testfile.txt...\n');

        const results = await agent({ llm })
            .then({
                prompt: 'Please read the contents of "testfile.txt" and tell me what it says.',
                mcps: [filesystem],
            })
            .run();

        console.log('\n📄 LLM Response:');
        console.log(results[0]?.llmOutput);

        const toolCalls = results[0]?.toolCalls || [];
        if (toolCalls.length > 0) {
            console.log('\n🔧 Tools called:');
            toolCalls.forEach(tc => console.log(`   - ${tc.name}(${JSON.stringify(tc.arguments)})`));
        } else {
            console.log('\n⚠️ No tool calls detected');
        }

        console.log('\n🎉 Test complete!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await filesystem.cleanup?.();
    }
}

testDeepSeekTools();
