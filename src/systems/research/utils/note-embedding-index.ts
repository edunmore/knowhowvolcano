/**
 * Note Embedding Index
 * 
 * Maintains embeddings for all notes in the vault for semantic search.
 * Uses a simple JSON file for persistence (sqlite-vec could be added later).
 */

import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import * as yaml from 'yaml';
import { createAzureEmbedding, type AzureEmbeddingHandle } from '../../../core/providers/azure-embedding-provider.js';

interface NoteEmbedding {
    id: string;
    title: string;
    type: string;
    embeddingKeys: string[];
    embedding: number[];
    filePath: string;
    updatedAt: string;
}

interface EmbeddingIndex {
    version: string;
    notes: Record<string, NoteEmbedding>;
}

export class NoteEmbeddingIndex {
    private indexPath: string;
    private index: EmbeddingIndex;
    private embedder: AzureEmbeddingHandle;
    private dirty: boolean = false;

    constructor(vaultDir: string) {
        this.indexPath = join(vaultDir, '_index', 'embeddings.json');
        this.index = { version: '1.0', notes: {} };
        this.embedder = createAzureEmbedding();
    }

    /**
     * Load existing index from disk
     */
    async load(): Promise<void> {
        try {
            const content = await fs.readFile(this.indexPath, 'utf-8');
            this.index = JSON.parse(content);
        } catch {
            // Index doesn't exist yet
            this.index = { version: '1.0', notes: {} };
        }
    }

    /**
     * Save index to disk
     */
    async save(): Promise<void> {
        if (!this.dirty) return;
        await fs.mkdir(join(this.indexPath, '..'), { recursive: true });
        await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
        this.dirty = false;
    }

    /**
     * Index a single note
     */
    async indexNote(filePath: string): Promise<void> {
        const content = await fs.readFile(filePath, 'utf-8');

        // Parse frontmatter
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch) return;

        let fm: any;
        try {
            fm = yaml.parse(fmMatch[1]);
        } catch {
            return;
        }

        const id = fm.id;
        const type = fm.type;
        const embeddingKeys = fm.embedding_keys || [];

        if (!id || !embeddingKeys.length) return;

        // Skip if already indexed with same keys
        const existing = this.index.notes[id];
        if (existing && JSON.stringify(existing.embeddingKeys) === JSON.stringify(embeddingKeys)) {
            return;
        }

        // Generate embedding from keys
        const keyText = embeddingKeys.join(' ');
        const embedding = await this.embedder.embedOne(keyText);

        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id;

        this.index.notes[id] = {
            id,
            title,
            type,
            embeddingKeys,
            embedding,
            filePath,
            updatedAt: new Date().toISOString()
        };

        this.dirty = true;
    }

    /**
     * Index all notes in the vault
     */
    async indexVault(vaultDir: string, logger?: { log: (msg: string) => Promise<void> }): Promise<number> {
        const folders = ['concepts', 'principles', 'procedures', 'misconceptions', 'examples'];
        let count = 0;

        for (const folder of folders) {
            const folderPath = join(vaultDir, folder);
            try {
                const files = await fs.readdir(folderPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        await this.indexNote(join(folderPath, file));
                        count++;
                    }
                }
            } catch {
                // Folder doesn't exist
            }
        }

        await this.save();
        await logger?.log(`[EmbeddingIndex] Indexed ${count} notes`);
        return count;
    }

    /**
     * Search for notes semantically similar to given keywords
     */
    async searchByKeywords(
        keywords: string[],
        topK: number = 3,
        threshold: number = 0.7
    ): Promise<Array<{ id: string; title: string; similarity: number; filePath: string }>> {
        if (keywords.length === 0) return [];

        const queryText = keywords.join(' ');
        const queryEmbedding = await this.embedder.embedOne(queryText);

        const items = Object.values(this.index.notes).map(n => ({
            id: n.id,
            embedding: n.embedding
        }));

        const results = this.embedder.findTopK(queryEmbedding, items, topK, threshold);

        return results.map(r => {
            const note = this.index.notes[r.id];
            return {
                id: r.id,
                title: note.title,
                similarity: r.similarity,
                filePath: note.filePath
            };
        });
    }

    /**
     * Check if a concept already exists by semantic similarity
     */
    async findExistingMatch(
        targetTitle: string,
        embeddingMatchKeys: string[],
        threshold: number = 0.75
    ): Promise<{ match: NoteEmbedding; similarity: number } | null> {
        // Use embedding match keys if available, otherwise use title words
        const keywords = embeddingMatchKeys.length > 0
            ? embeddingMatchKeys
            : targetTitle.toLowerCase().split(/\s+/);

        const matches = await this.searchByKeywords(keywords, 1, threshold);

        if (matches.length > 0) {
            const best = matches[0];
            return {
                match: this.index.notes[best.id],
                similarity: best.similarity
            };
        }

        return null;
    }

    /**
     * Get count of indexed notes
     */
    get count(): number {
        return Object.keys(this.index.notes).length;
    }
}

export default NoteEmbeddingIndex;
