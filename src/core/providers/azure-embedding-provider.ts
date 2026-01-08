/**
 * Azure OpenAI Embedding Provider
 * 
 * Uses embed-v-4-0 model for semantic search
 */

import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AzureEmbeddingConfig {
    apiKeysPath?: string;
    apiKey?: string;
}

function loadApiKey(apiKeysPath: string): string {
    const content = readFileSync(apiKeysPath, 'utf-8');
    const keys = JSON.parse(content);
    if (!keys.azure?.apiKey || keys.azure.apiKey === 'YOUR_AZURE_API_KEY_HERE') {
        throw new Error('Please update api-keys.json with your Azure API key');
    }
    return keys.azure.apiKey;
}

/**
 * Create Azure embedding provider
 */
export function createAzureEmbedding(cfg: AzureEmbeddingConfig = {}) {
    const apiKeysPath = cfg.apiKeysPath || join(process.cwd(), 'api-keys.json');
    const apiKey = cfg.apiKey || loadApiKey(apiKeysPath);

    const endpoint = "https://aineu-marcus.cognitiveservices.azure.com/openai/v1/";
    const modelName = "embed-v-4-0";

    const client = new OpenAI({
        baseURL: endpoint,
        apiKey
    });

    return {
        /**
         * Get embeddings for a list of texts
         */
        async embed(texts: string[]): Promise<number[][]> {
            if (texts.length === 0) return [];

            const response = await client.embeddings.create({
                model: modelName,
                input: texts
            });

            return response.data.map(d => d.embedding);
        },

        /**
         * Get embedding for a single text
         */
        async embedOne(text: string): Promise<number[]> {
            const [embedding] = await this.embed([text]);
            return embedding;
        },

        /**
         * Compute cosine similarity between two vectors
         */
        cosineSimilarity(a: number[], b: number[]): number {
            if (a.length !== b.length) return 0;

            let dotProduct = 0;
            let normA = 0;
            let normB = 0;

            for (let i = 0; i < a.length; i++) {
                dotProduct += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }

            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        },

        /**
         * Find top-k most similar items from a list
         */
        findTopK(
            queryEmbedding: number[],
            items: Array<{ id: string; embedding: number[] }>,
            k: number = 3,
            threshold: number = 0.7
        ): Array<{ id: string; similarity: number }> {
            const scored = items
                .map(item => ({
                    id: item.id,
                    similarity: this.cosineSimilarity(queryEmbedding, item.embedding)
                }))
                .filter(item => item.similarity >= threshold)
                .sort((a, b) => b.similarity - a.similarity);

            return scored.slice(0, k);
        }
    };
}

export type AzureEmbeddingHandle = ReturnType<typeof createAzureEmbedding>;
export default createAzureEmbedding;
