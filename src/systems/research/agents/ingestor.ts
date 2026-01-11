import type { LLMHandle } from 'volcano-sdk';
import { join, basename } from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { RunLogger } from '../run-logger.js';

/**
 * Generate deterministic source ID from content hash
 */
function generateSourceId(content: string, filename: string): string {
    const hash = createHash('sha1')
        .update(content)
        .digest('hex')
        .slice(0, 8);

    // Create readable slug from filename
    const slug = basename(filename, '.md')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);

    return `source-${slug}-${hash}`;
}

/**
 * Generate a simple title from filename (no LLM needed)
 */
function generateTitle(filename: string): string {
    return basename(filename, '.md')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Run ingestor: stores raw text and creates source anchor (NO LLM CALL)
 */
export async function runIngestor(
    _llm: LLMHandle,  // Preserved for API compatibility, not used
    filePath: string,
    vaultDir: string,
    logger: RunLogger
) {
    await logger.log(`Starting Ingestor for: ${filePath}`);

    const fileName = basename(filePath);
    const content = await fs.readFile(filePath, 'utf-8');

    // Generate deterministic source ID from content hash
    const sourceId = generateSourceId(content, fileName);
    const title = generateTitle(fileName);

    // 1. Store raw text in _sources/<hash>/raw.md
    const rawSourceDir = join(vaultDir, '_sources', sourceId);
    await fs.mkdir(rawSourceDir, { recursive: true });

    const rawPath = join(rawSourceDir, 'raw.md');
    await fs.writeFile(rawPath, content, 'utf-8');

    // Write metadata
    const metaPath = join(rawSourceDir, 'meta.json');
    const meta = {
        source_id: sourceId,
        original_file: filePath,
        filename: fileName,
        content_hash: createHash('sha1').update(content).digest('hex'),
        ingested_at: new Date().toISOString(),
        char_count: content.length,
        line_count: content.split('\n').length,
    };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    await logger.log(`Stored raw source: ${rawPath}`);

    // 2. Create source anchor in sources/ (for vault linking)
    const sourcesDir = join(vaultDir, 'sources');
    await fs.mkdir(sourcesDir, { recursive: true });

    const outputPath = join(sourcesDir, `${sourceId}.md`);

    // Create source anchor note (NO LLM needed)
    const noteContent = `---
id: ${sourceId}
type: source_anchor
title: "${title}"
tags: [source, ingested]
original_file: "${filePath}"
content_hash: "${meta.content_hash}"
ingested_at: "${meta.ingested_at}"
---
# ${title}

## Source Info

- **Original File**: [${fileName}](${filePath})
- **Raw Storage**: [_sources/${sourceId}/raw.md](../_sources/${sourceId}/raw.md)
- **Characters**: ${meta.char_count}
- **Lines**: ${meta.line_count}

## License Note

Raw source text is stored in \`_sources/\` and can be excluded from distribution.
The knowledge notes derived from this source reference this anchor via \`derived_from\`.
`;

    await fs.writeFile(outputPath, noteContent);
    await logger.log(`Created source anchor: ${outputPath}`);

    return {
        sourceId,
        sourcePath: outputPath,
        rawPath,
        contentHash: meta.content_hash,
    };
}

