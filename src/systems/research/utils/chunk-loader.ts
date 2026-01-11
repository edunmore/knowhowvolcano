/**
 * Simple chunk loading/writing utilities for gate executor
 */

import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { ChunkMetadata } from './chunker.js';

export interface LoadedChunk {
    metadata: ChunkMetadata;
    content: string;
    filePath: string;
}

/**
 * Load all chunks from a source directory
 */
export async function loadSourceChunks(vaultDir: string, sourceId: string): Promise<LoadedChunk[]> {
    const chunksDir = join(vaultDir, '_sources', sourceId, 'chunks');
    const files = await fs.readdir(chunksDir);
    const chunks: LoadedChunk[] = [];

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(chunksDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Parse frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (match) {
            const frontmatter = match[1];
            const body = match[2];

            // Parse YAML-like frontmatter to metadata object
            const metadata: any = {};
            const lines = frontmatter.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.slice(0, colonIndex).trim();
                    let value: any = line.slice(colonIndex + 1).trim();

                    // Parse numbers
                    if (!isNaN(Number(value))) {
                        value = Number(value);
                    }

                    metadata[key] = value;
                }
            }

            chunks.push({
                metadata: metadata as ChunkMetadata,
                content: body,
                filePath
            });
        }
    }

    return chunks;
}

/**
 * Write chunk back to file with updated metadata
 */
export async function writeSourceChunk(chunk: LoadedChunk): Promise<void> {
    const frontmatter = Object.entries(chunk.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

    const content = `---\n${frontmatter}\n---\n${chunk.content}`;
    await fs.writeFile(chunk.filePath, content);
}
