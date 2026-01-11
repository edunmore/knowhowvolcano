/**
 * Ingest Tool
 * 
 * Ingests source file into vault.
 */

import * as fs from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';

export interface IngestInput {
    sourcePath: string;
    vaultDir: string;
}

export interface IngestResult {
    success: boolean;
    sourceId: string;
    rawPath: string;
}

export async function ingest(input: IngestInput): Promise<IngestResult> {
    const { sourcePath, vaultDir } = input;

    const content = await fs.readFile(sourcePath, 'utf-8');
    const hash = createHash('sha1').update(content).digest('hex').slice(0, 8);
    const slug = basename(sourcePath, '.md')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 50);

    const sourceId = `source-${slug}-${hash}`;
    const sourceDir = join(vaultDir, '_sources', sourceId);

    await fs.mkdir(sourceDir, { recursive: true });
    const rawPath = join(sourceDir, 'raw.md');
    await fs.writeFile(rawPath, content, 'utf-8');

    // Write metadata
    await fs.writeFile(join(sourceDir, 'meta.json'), JSON.stringify({
        sourceId,
        originalPath: sourcePath,
        filename: basename(sourcePath),
        charCount: content.length,
        ingestedAt: new Date().toISOString()
    }, null, 2), 'utf-8');

    return {
        success: true,
        sourceId,
        rawPath
    };
}
