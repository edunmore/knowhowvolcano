/**
 * SQLite-Vec Vector Database for Note Embeddings
 * 
 * Uses sqlite-vec for scalable, filesystem-based vector search.
 * Database stored at _index/vectors.db
 */

import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { join } from 'node:path';
import * as fs from 'node:fs/promises';
import * as yaml from 'yaml';
import { createAzureEmbedding, type AzureEmbeddingHandle } from '../../../core/providers/azure-embedding-provider.js';

interface NoteRecord {
    id: string;
    title: string;
    type: string;
    embeddingKeys: string[];
    filePath: string;
}

export class VectorStore {
    private db: Database.Database;
    private embedder: AzureEmbeddingHandle;
    private vaultDir: string;
    private embeddingDim: number = 1536; // embed-v-4-0 dimension

    constructor(vaultDir: string) {
        this.vaultDir = vaultDir;
        const dbPath = join(vaultDir, '_index', 'vectors.db');

        // Ensure directory exists
        const indexDir = join(vaultDir, '_index');

        this.db = new Database(dbPath);
        sqliteVec.load(this.db);

        this.embedder = createAzureEmbedding();

        this.initSchema();
    }

    private initSchema(): void {
        // Create notes metadata table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT,
                embedding_keys TEXT,
                file_path TEXT,
                updated_at TEXT
            )
        `);

        // Create virtual vector table for embeddings
        this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS note_vectors USING vec0(
                note_id TEXT PRIMARY KEY,
                embedding FLOAT[${this.embeddingDim}]
            )
        `);
    }

    /**
     * Add or update a note in the vector store
     */
    async upsertNote(note: NoteRecord, embedding: number[]): Promise<void> {
        const now = new Date().toISOString();

        // Upsert metadata
        this.db.prepare(`
            INSERT OR REPLACE INTO notes (id, title, type, embedding_keys, file_path, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            note.id,
            note.title,
            note.type,
            JSON.stringify(note.embeddingKeys),
            note.filePath,
            now
        );

        // Delete old vector if exists
        this.db.prepare(`DELETE FROM note_vectors WHERE note_id = ?`).run(note.id);

        // Insert new vector
        const embeddingBlob = new Float32Array(embedding);
        this.db.prepare(`
            INSERT INTO note_vectors (note_id, embedding)
            VALUES (?, ?)
        `).run(note.id, embeddingBlob);
    }

    /**
     * Search for similar notes using cosine similarity
     */
    async searchSimilar(
        queryEmbedding: number[],
        topK: number = 5,
        threshold: number = 0.7
    ): Promise<Array<{ id: string; title: string; similarity: number; filePath: string }>> {
        const embeddingBlob = new Float32Array(queryEmbedding);

        const results = this.db.prepare(`
            SELECT 
                v.note_id,
                n.title,
                n.file_path,
                vec_distance_cosine(v.embedding, ?) as distance
            FROM note_vectors v
            JOIN notes n ON n.id = v.note_id
            ORDER BY distance ASC
            LIMIT ?
        `).all(embeddingBlob, topK) as Array<{
            note_id: string;
            title: string;
            file_path: string;
            distance: number;
        }>;

        // Convert distance to similarity (cosine distance → similarity)
        return results
            .map(r => ({
                id: r.note_id,
                title: r.title,
                filePath: r.file_path,
                similarity: 1 - r.distance  // cosine distance to similarity
            }))
            .filter(r => r.similarity >= threshold);
    }

    /**
     * Find existing match for a target concept
     */
    async findExistingMatch(
        targetTitle: string,
        embeddingMatchKeys: string[],
        threshold: number = 0.7
    ): Promise<{ match: NoteRecord; similarity: number } | null> {
        // Generate embedding from keywords
        const keywords = embeddingMatchKeys.length > 0
            ? embeddingMatchKeys
            : targetTitle.toLowerCase().split(/\s+/);

        const queryText = keywords.join(' ');
        const queryEmbedding = await this.embedder.embedOne(queryText);

        const matches = await this.searchSimilar(queryEmbedding, 1, threshold);

        if (matches.length > 0) {
            const best = matches[0];
            // Fetch full note record
            const note = this.db.prepare(`
                SELECT id, title, type, embedding_keys, file_path FROM notes WHERE id = ?
            `).get(best.id) as any;

            return {
                match: {
                    id: note.id,
                    title: note.title,
                    type: note.type,
                    embeddingKeys: JSON.parse(note.embedding_keys || '[]'),
                    filePath: note.file_path
                },
                similarity: best.similarity
            };
        }

        return null;
    }

    /**
     * Index a single note file
     */
    async indexNote(filePath: string): Promise<boolean> {
        let content: string;
        try {
            content = await fs.readFile(filePath, 'utf-8');
        } catch {
            return false;
        }

        // Parse frontmatter
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch) return false;

        let fm: any;
        try {
            fm = yaml.parse(fmMatch[1]);
        } catch {
            return false;
        }

        const id = fm.id;
        const type = fm.type;
        const embeddingKeys = fm.embedding_keys || [];

        if (!id || !embeddingKeys.length) return false;

        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id;

        // Generate embedding from keys
        const keyText = embeddingKeys.join(' ');
        const embedding = await this.embedder.embedOne(keyText);

        await this.upsertNote({
            id,
            title,
            type,
            embeddingKeys,
            filePath
        }, embedding);

        return true;
    }

    /**
     * Index all notes in the vault
     */
    async indexVault(logger?: { log: (msg: string) => Promise<void> }): Promise<number> {
        const folders = ['concepts', 'principles', 'procedures', 'misconceptions', 'examples'];
        let count = 0;

        for (const folder of folders) {
            const folderPath = join(this.vaultDir, folder);
            try {
                const files = await fs.readdir(folderPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const indexed = await this.indexNote(join(folderPath, file));
                        if (indexed) count++;
                    }
                }
            } catch {
                // Folder doesn't exist
            }
        }

        await logger?.log(`[VectorStore] Indexed ${count} notes`);
        return count;
    }

    /**
     * Get count of indexed notes
     */
    get count(): number {
        const result = this.db.prepare(`SELECT COUNT(*) as count FROM notes`).get() as { count: number };
        return result.count;
    }

    /**
     * Close the database connection
     */
    close(): void {
        this.db.close();
    }
}

export default VectorStore;
