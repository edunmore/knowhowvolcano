/**
 * Test MCP tool discovery
 */

import { mcpStdio, discoverTools } from 'volcano-sdk';
import { resolve } from 'node:path';

async function test() {
    console.log('Starting MCP server...');

    const mcp = mcpStdio({
        command: 'npx',
        args: ['tsx', resolve('src/volcanofive/mcp-server/index.ts')]
    });

    console.log('Discovering tools...');

    try {
        const tools = await discoverTools([mcp]);
        console.log(`Found ${tools.length} tools:`);
        for (const t of tools) {
            console.log(`  - ${t.name}: ${t.description?.slice(0, 80)}`);
        }
    } catch (e) {
        console.error('Error discovering tools:', e);
    }

    console.log('\nCleaning up...');
    await mcp.cleanup?.();
    console.log('Done');
}

test();
