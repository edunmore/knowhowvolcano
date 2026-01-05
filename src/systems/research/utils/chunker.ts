import { join } from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { VAULT_LAYOUT, resolveVaultPath } from './vault-utils.js';

/**
 * Chunk metadata stored in frontmatter
 */
export interface ChunkMetadata {
    id: string;
    type: 'source_chunk';
    source_id: string;
    seq: number;
    start_char: number;
    end_char: number;
    sha1: string;
    content_class?: string;
    relevance_score?: number;
    decision?: 'SKIP' | 'LIGHT_SCAN' | 'FULL_MODEL';
    gate_confidence?: number;
    gate_reasons?: string[];
}

/**
 * Source manifest stored in _sources/<source_id>/manifest.json
 */
export interface SourceManifest {
    source_id: string;
    original_path: string;
    original_filename: string;
    total_chars: number;
    total_chunks: number;
    created_at: string;
    sha1: string;
}

/**
 * Stored chunk with metadata and content
 */
export interface StoredChunk {
    metadata: ChunkMetadata;
    content: string;
    heading?: string;
}

/**
 * Chunking configuration
 */
export interface ChunkConfig {
    /** Target chunk size in characters (~800-1200 tokens = 3200-4800 chars) */
    targetChunkChars?: number;
    /** Minimum chunk size (don't create tiny chunks) */
    minChunkChars?: number;
    /** Try to split at paragraph boundaries */
    splitAtParagraphs?: boolean;
}

const DEFAULT_CONFIG: Required<ChunkConfig> = {
    targetChunkChars: 4000, // ~1000 tokens
    minChunkChars: 800,     // ~200 tokens
    splitAtParagraphs: true,
};

/**
 * Generate deterministic source_id from content
 */
export function generateSourceId(content: string): string {
    const hash = createHash('sha1').update(content).digest('hex');
    return `src_${hash.slice(0, 12)}`;
}

/**
 * Find the nearest heading above a given position
 */
function findNearestHeading(content: string, position: number): string | undefined {
    const beforePos = content.slice(0, position);
    const headingMatches = [...beforePos.matchAll(/^#+\s+(.+)$/gm)];
    if (headingMatches.length === 0) return undefined;
    return headingMatches[headingMatches.length - 1][1];
}

/**
 * Find a good split point near the target position
 */
function findSplitPoint(content: string, targetPos: number, config: Required<ChunkConfig>): number {
    if (!config.splitAtParagraphs) return targetPos;

    // Look for paragraph break (double newline) within ~500 chars of target
    const searchStart = Math.max(0, targetPos - 500);
    const searchEnd = Math.min(content.length, targetPos + 500);
    const searchRegion = content.slice(searchStart, searchEnd);

    // Find all paragraph breaks in the search region
    const paragraphBreaks: number[] = [];
    let match;
    const regex = /\n\n+/g;
    while ((match = regex.exec(searchRegion)) !== null) {
        paragraphBreaks.push(searchStart + match.index + match[0].length);
    }

    if (paragraphBreaks.length === 0) return targetPos;

    // Find the break closest to target
    let closestBreak = paragraphBreaks[0];
    let closestDist = Math.abs(closestBreak - targetPos);

    for (const breakPos of paragraphBreaks) {
        const dist = Math.abs(breakPos - targetPos);
        if (dist < closestDist) {
            closestDist = dist;
            closestBreak = breakPos;
        }
    }

    return closestBreak;
}

/**
 * Split content into chunks
 */
export function splitIntoChunks(
    content: string,
    sourceId: string,
    config: ChunkConfig = {}
): StoredChunk[] {
    const cfg: Required<ChunkConfig> = { ...DEFAULT_CONFIG, ...config };
    const chunks: StoredChunk[] = [];

    let position = 0;
    let seq = 0;

    while (position < content.length) {
        const remaining = content.length - position;
        let chunkEnd: number;

        if (remaining <= cfg.targetChunkChars * 1.5) {
            // Last chunk or nearly last - take the rest
            chunkEnd = content.length;
        } else {
            // Find a good split point
            const targetEnd = position + cfg.targetChunkChars;
            chunkEnd = findSplitPoint(content, targetEnd, cfg);
        }

        const chunkContent = content.slice(position, chunkEnd);

        // Skip tiny chunks (merge with previous if possible)
        if (chunkContent.length < cfg.minChunkChars && chunks.length > 0) {
            // Merge with previous chunk
            const prev = chunks[chunks.length - 1];
            prev.content += chunkContent;
            prev.metadata.end_char = chunkEnd;
            prev.metadata.sha1 = createHash('sha1').update(prev.content).digest('hex').slice(0, 12);
            position = chunkEnd;
            continue;
        }

        const chunkSeq = seq.toString().padStart(6, '0');
        const chunkId = `chunk_${sourceId}_${chunkSeq}`;
        const heading = findNearestHeading(content, position);

        const metadata: ChunkMetadata = {
            id: chunkId,
            type: 'source_chunk',
            source_id: sourceId,
            seq,
            start_char: position,
            end_char: chunkEnd,
            sha1: createHash('sha1').update(chunkContent).digest('hex').slice(0, 12),
        };

        chunks.push({
            metadata,
            content: chunkContent,
            heading,
        });

        position = chunkEnd;
        seq++;
    }

    return chunks;
}

/**
 * Format chunk metadata as YAML frontmatter
 */
export function formatChunkFrontmatter(meta: ChunkMetadata): string {
    const lines = [
        '---',
        `id: ${meta.id}`,
        `type: ${meta.type}`,
        `source_id: ${meta.source_id}`,
        `seq: ${meta.seq.toString().padStart(6, '0')}`,
        `start_char: ${meta.start_char}`,
        `end_char: ${meta.end_char}`,
        `sha1: "${meta.sha1}"`,
    ];

    if (meta.content_class) lines.push(`content_class: ${meta.content_class}`);
    if (meta.relevance_score !== undefined) lines.push(`relevance_score: ${meta.relevance_score.toFixed(2)}`);
    if (meta.decision) lines.push(`decision: ${meta.decision}`);
    if (meta.gate_confidence !== undefined) lines.push(`gate_confidence: ${meta.gate_confidence.toFixed(2)}`);
    if (meta.gate_reasons && meta.gate_reasons.length > 0) {
        lines.push('gate_reasons:');
        for (const reason of meta.gate_reasons) {
            lines.push(`  - "${reason}"`);
        }
    }

    lines.push('---');
    return lines.join('\n');
}

/**
 * Write chunks to the vault _sources directory
 */
export async function writeChunksToVault(
    vaultDir: string,
    sourceId: string,
    originalPath: string,
    chunks: StoredChunk[]
): Promise<SourceManifest> {
    const sourcesDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.sources, sourceId);
    const chunksDir = join(sourcesDir, 'chunks');

    // Create directories
    await fs.mkdir(chunksDir, { recursive: true });

    // Write each chunk
    for (const chunk of chunks) {
        const frontmatter = formatChunkFrontmatter(chunk.metadata);
        const heading = chunk.heading ? `# ${chunk.heading}\n\n` : '';
        const content = `${frontmatter}\n\n${heading}${chunk.content}`;

        const filename = `${chunk.metadata.seq.toString().padStart(6, '0')}.md`;
        await fs.writeFile(join(chunksDir, filename), content, 'utf-8');
    }

    // Calculate total chars
    const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);

    // Calculate source sha1
    const allContent = chunks.map(c => c.content).join('');
    const sha1 = createHash('sha1').update(allContent).digest('hex');

    // Write manifest
    const manifest: SourceManifest = {
        source_id: sourceId,
        original_path: originalPath,
        original_filename: originalPath.split('/').pop() || 'unknown',
        total_chars: totalChars,
        total_chunks: chunks.length,
        created_at: new Date().toISOString(),
        sha1,
    };

    await fs.writeFile(
        join(sourcesDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );

    return manifest;
}

/**
 * Load chunks index from vault
 */
export async function loadChunksIndex(vaultDir: string): Promise<ChunkMetadata[]> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'chunks.json');

    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(content) as ChunkMetadata[];
    } catch {
        return [];
    }
}

/**
 * Update chunks index in vault
 */
export async function updateChunksIndex(
    vaultDir: string,
    chunks: ChunkMetadata[]
): Promise<void> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'chunks.json');

    // Load existing
    let existing: ChunkMetadata[] = [];
    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        existing = JSON.parse(content);
    } catch {
        // No existing index
    }

    // Merge (replace existing by id)
    const byId = new Map<string, ChunkMetadata>();
    for (const chunk of existing) {
        byId.set(chunk.id, chunk);
    }
    for (const chunk of chunks) {
        byId.set(chunk.id, chunk);
    }

    // Write
    await fs.writeFile(
        indexPath,
        JSON.stringify(Array.from(byId.values()), null, 2),
        'utf-8'
    );
}
