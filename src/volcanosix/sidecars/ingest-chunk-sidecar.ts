/**
 * Ingest+Chunk Sidecar
 * 
 * Pure functions for ingesting and chunking documents.
 * Reused from volcanofive/mcp-server/tools.
 */

import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export interface IngestResult {
    success: boolean;
    sourceId: string;
    rawPath: string;
}

export interface ChunkResult {
    success: boolean;
    sourceId: string;
    chunksPath: string;
    totalChunks: number;
    chunks: Array<{ id: string; content: string }>;
}

/**
 * Ingest a source file into the vault
 */
export async function ingestFn(args: { sourcePath: string; vaultDir: string }): Promise<IngestResult> {
    const { sourcePath, vaultDir } = args;

    const content = await fs.readFile(sourcePath, 'utf-8');
    const filename = sourcePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown';
    const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
    const sourceId = `source-${filename}-${hash}`;

    const sourceDir = join(vaultDir, '_sources', sourceId);
    await fs.mkdir(sourceDir, { recursive: true });

    const rawPath = join(sourceDir, 'raw.md');
    await fs.writeFile(rawPath, content, 'utf-8');

    return { success: true, sourceId, rawPath };
}

/**
 * Chunk a document into semantic pieces
 */
export async function chunkFn(args: { sourceId: string; vaultDir: string }): Promise<ChunkResult> {
    const { sourceId, vaultDir } = args;

    const rawPath = join(vaultDir, '_sources', sourceId, 'raw.md');
    const content = await fs.readFile(rawPath, 'utf-8');

    // Simple chunking by headers
    const sections = content.split(/^## /m);
    const chunks = sections.map((section, idx) => ({
        id: `chunk-${idx}`,
        content: idx === 0 ? section : `## ${section}`
    })).filter(c => c.content.trim().length > 0);

    const chunksDir = join(vaultDir, '_sources', sourceId, 'chunks');
    await fs.mkdir(chunksDir, { recursive: true });

    for (const chunk of chunks) {
        await fs.writeFile(join(chunksDir, `${chunk.id}.md`), chunk.content, 'utf-8');
    }

    const manifestPath = join(chunksDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify({ sourceId, chunks: chunks.map(c => c.id) }, null, 2), 'utf-8');

    return { success: true, sourceId, chunksPath: manifestPath, totalChunks: chunks.length, chunks };
}
