/**
 * Pipeline Tools MCP Server
 * 
 * Exposes pipeline tools via stdio MCP protocol.
 * Run with: npx tsx src/volcanofive/mcp-server/index.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { ingest, type IngestInput } from './tools/ingest.js';
import { chunk, type ChunkInput } from './tools/chunk.js';

// Create server
const server = new McpServer({
    name: 'pipeline-tools',
    version: '1.0.0'
});

// Register: ingest tool
server.tool(
    'ingest',
    'Ingest a source file into the vault. Creates source ID and stores raw content.',
    {
        sourcePath: z.string().describe('Path to source markdown file'),
        vaultDir: z.string().describe('Path to vault directory')
    },
    async (args) => {
        const result = await ingest(args as IngestInput);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
    }
);

// Register: chunk tool
server.tool(
    'chunk',
    'Split ingested source into semantic chunks. Call after ingest.',
    {
        sourceId: z.string().describe('Source ID from ingest'),
        vaultDir: z.string().describe('Path to vault directory')
    },
    async (args) => {
        const result = await chunk(args as ChunkInput);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
    }
);

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP] Pipeline Tools server running');
}

main().catch(console.error);
