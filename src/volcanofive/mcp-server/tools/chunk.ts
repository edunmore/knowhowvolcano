/**
 * Chunk Tool
 * 
 * Splits source document into semantic chunks.
 * Clean function - used by MCP server.
 */

import * as fs from 'node:fs/promises';
import { join } from 'node:path';

export interface ChunkInput {
    sourceId: string;
    vaultDir: string;
}

export interface ChunkResult {
    success: boolean;
    sourceId: string;
    chunksPath: string;
    totalChunks: number;
}

export async function chunk(input: ChunkInput): Promise<ChunkResult> {
    const { sourceId, vaultDir } = input;

    // Load raw content
    const rawPath = join(vaultDir, '_sources', sourceId, 'raw.md');
    const content = await fs.readFile(rawPath, 'utf-8');

    // Split at paragraph boundaries
    const chunks = splitAtParagraphs(content, 4000);

    // Write chunks to vault
    const chunksDir = join(vaultDir, '_sources', sourceId, 'chunks');
    await fs.mkdir(chunksDir, { recursive: true });

    for (let i = 0; i < chunks.length; i++) {
        await fs.writeFile(
            join(chunksDir, `${i.toString().padStart(4, '0')}.md`),
            chunks[i],
            'utf-8'
        );
    }

    // Write manifest
    const manifestPath = join(chunksDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify({
        sourceId,
        totalChunks: chunks.length,
        createdAt: new Date().toISOString()
    }, null, 2), 'utf-8');

    return {
        success: true,
        sourceId,
        chunksPath: manifestPath,
        totalChunks: chunks.length
    };
}

function splitAtParagraphs(content: string, targetSize: number): string[] {
    const chunks: string[] = [];
    let pos = 0;

    while (pos < content.length) {
        let end = Math.min(pos + targetSize, content.length);

        if (end < content.length) {
            const region = content.slice(Math.max(pos, end - 500), Math.min(content.length, end + 500));
            const match = region.match(/\n\n+/);
            if (match) {
                end = Math.max(pos, end - 500) + match.index! + match[0].length;
            }
        }

        chunks.push(content.slice(pos, end));
        pos = end;
    }

    return chunks;
}
