import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import fs from 'node:fs/promises';
import { join, basename } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import { createAzureGPT5Nano } from '../../../core/providers/azure-gpt5-nano-provider.js';

interface LinkIntent {
    targetTitle: string;
    embeddingMatchKeys: string[];
    sourceFile: string;
    context: string;
}

interface ParsedLinkIntents {
    note_id: string;
    link_intents: Array<{
        target_title: string;
        intent_type?: string;
        confidence?: number;
        embedding_match_keys?: string[];
        reason?: string;
    }>;
}

/**
 * Parse LINK_INTENTS JSON from note content
 */
function parseLinkIntents(content: string): ParsedLinkIntents | null {
    // Try with closing backticks
    let match = content.match(/## LINK_INTENTS\s*```json\s*([\s\S]*?)```/);

    // If not found, try without closing backticks
    if (!match) {
        match = content.match(/## LINK_INTENTS\s*```json\s*([\s\S]*?\})\s*$/);
    }

    if (!match) return null;

    try {
        let jsonStr = match[1].trim();
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
            jsonStr += '}'.repeat(openBraces - closeBraces);
        }
        return JSON.parse(jsonStr) as ParsedLinkIntents;
    } catch {
        return null;
    }
}

export async function runLinker(
    llm: LLMHandle,
    vaultDir: string,
    logger: RunLogger
) {
    await logger.log('Starting Linker: Resolving links and creating stubs...');

    // 1. Scan all notes to find existing IDs, filenames, and their embedding_keys
    const existingFiles = new Set<string>();
    const noteFiles: string[] = [];

    // Map of note title/id -> embedding_keys for matching
    const noteEmbeddingKeys = new Map<string, { id: string; keys: string[]; filePath: string }>();

    async function scan(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('_')) await scan(fullPath);
            } else if (entry.name.endsWith('.md')) {
                existingFiles.add(entry.name);
                existingFiles.add(entry.name.replace(/\.md$/, ''));
                noteFiles.push(fullPath);

                // Extract embedding_keys from frontmatter
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
                    if (fmMatch) {
                        const keysMatch = fmMatch[1].match(/embedding_keys:\s*\[(.*?)\]/s);
                        if (keysMatch) {
                            const keys = keysMatch[1].split(',').map(k =>
                                k.trim().replace(/^["']|["']$/g, '')
                            ).filter(k => k.length > 0);

                            const idMatch = fmMatch[1].match(/id:\s*([a-z0-9-_]+)/);
                            const id = idMatch ? idMatch[1] : entry.name.replace('.md', '');

                            // Also extract title
                            const titleMatch = content.match(/^#\s+(.+)$/m);
                            const title = titleMatch ? titleMatch[1] : id;

                            noteEmbeddingKeys.set(title.toLowerCase(), { id, keys, filePath: fullPath });
                            noteEmbeddingKeys.set(id.toLowerCase(), { id, keys, filePath: fullPath });
                        }
                    }
                } catch { }
            }
        }
    }

    await scan(vaultDir);
    await logger.log(`Found ${existingFiles.size} existing addressable targets.`);
    await logger.log(`Found ${noteEmbeddingKeys.size} notes with embedding_keys.`);

    // 2. Collect all link intents from LINK_INTENTS sections (not just wiki links)
    const allLinkIntents: LinkIntent[] = [];

    for (const file of noteFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseLinkIntents(content);

        if (parsed && parsed.link_intents) {
            for (const intent of parsed.link_intents) {
                if (!intent.target_title) continue;

                allLinkIntents.push({
                    targetTitle: intent.target_title,
                    embeddingMatchKeys: intent.embedding_match_keys || [],
                    sourceFile: file,
                    context: intent.reason || ''
                });
            }
        }
    }

    await logger.log(`Found ${allLinkIntents.length} link intents with embedding keys.`);

    // 3. Initialize vector store for semantic matching
    const { VectorStore } = await import('../utils/vector-store.js');
    const indexDir = join(vaultDir, '_index');
    await fs.mkdir(indexDir, { recursive: true });

    const vectorStore = new VectorStore(vaultDir);

    // Index existing notes if not already done
    if (vectorStore.count === 0) {
        await logger.log(`[Link] Building vector index...`);
        await vectorStore.indexVault(logger);
    }
    await logger.log(`[Link] Vector store has ${vectorStore.count} indexed notes.`);

    // 4. Deduplicate link intents by target title
    const uniqueIntents = new Map<string, LinkIntent>();
    for (const intent of allLinkIntents) {
        const key = intent.targetTitle.toLowerCase();
        if (!uniqueIntents.has(key)) {
            uniqueIntents.set(key, intent);
        } else {
            // Merge embedding keys
            const existing = uniqueIntents.get(key)!;
            const mergedKeys = [...new Set([...existing.embeddingMatchKeys, ...intent.embeddingMatchKeys])];
            existing.embeddingMatchKeys = mergedKeys;
        }
    }

    await logger.log(`[Link] ${uniqueIntents.size} unique link targets to check.`);

    let stubsCreated = 0;
    let matchesFound = 0;
    let alreadyExists = 0;

    // 5. For each link intent, check if it already exists or has a semantic match
    for (const [targetKey, intent] of uniqueIntents) {
        // Skip sources or strange links
        if (intent.targetTitle.startsWith('http')) continue;
        if (intent.targetTitle.startsWith('src_')) continue;

        // Check 1: Does a note with this exact title/id exist?
        const exactMatch = noteEmbeddingKeys.get(targetKey);
        if (exactMatch) {
            await logger.log(`[Link] Exact match: "${intent.targetTitle}" → ${exactMatch.id}`);
            alreadyExists++;
            continue;
        }

        // Check 2: Semantic match using embedding_match_keys
        if (intent.embeddingMatchKeys.length > 0) {
            const match = await vectorStore.findExistingMatch(
                intent.targetTitle,
                intent.embeddingMatchKeys,
                0.7
            );

            if (match) {
                await logger.log(`[Link] Semantic match: "${intent.targetTitle}" → ${match.match.title} (${(match.similarity * 100).toFixed(0)}%)`);
                matchesFound++;
                continue;
            }
        }

        // No match found - create stub
        await logger.log(`[Link] Creating stub for: ${intent.targetTitle}`);

        const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-create-stub.md');
        const prompt = await renderPrompt(promptPath, {
            concept_name: intent.targetTitle,
            context_usage: intent.context,
            embedding_keys: intent.embeddingMatchKeys.join(', ')
        });

        const gpt5nano = createAzureGPT5Nano({ maxTokens: 500 });

        const result = await agent({ llm: gpt5nano, name: 'Linker-Stubber' })
            .then({ prompt })
            .run();

        const output = result[0]?.llmOutput;
        if (output) {
            let cleanOutput = output.replace(/^```markdown\n/, '').replace(/\n```$/, '');

            // Generate filename from ID or slug
            const idMatch = cleanOutput.match(/id:\s*([a-z0-9-_]+)/);
            let id = idMatch ? idMatch[1] : '';
            if (!id) {
                id = `stub-concept-${intent.targetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            } else if (!id.startsWith('stub-')) {
                id = `stub-${id}`;
            }

            // Add embedding_match_keys to stub for debugging
            if (intent.embeddingMatchKeys.length > 0 && !cleanOutput.includes('embedding_match_keys')) {
                // Insert after id line in frontmatter
                cleanOutput = cleanOutput.replace(
                    /(id:\s*[a-z0-9-_]+)/,
                    `$1\nembedding_match_keys: ${JSON.stringify(intent.embeddingMatchKeys)}`
                );
            }

            // Stubs go to stubs/ folder
            const stubDir = join(vaultDir, 'stubs');
            await fs.mkdir(stubDir, { recursive: true });
            const stubPath = join(stubDir, `${id}.md`);

            if (!existingFiles.has(id)) {
                await fs.writeFile(stubPath, cleanOutput);
                await logger.log(`[Link] Stub created: ${stubPath}`);
                existingFiles.add(id);
                stubsCreated++;

                // Index stub in vector store for future dedup
                try {
                    await vectorStore.indexNote(stubPath);
                    await logger.log(`[Link] Stub indexed in vector store`, 'DEBUG');
                } catch (e: any) {
                    await logger.log(`[Link] Failed to index stub: ${e.message}`, 'WARN');
                }
            }
        }
    }

    await logger.log(`[Link] Summary: ${alreadyExists} exact matches, ${matchesFound} semantic matches, ${stubsCreated} stubs created`);
    return stubsCreated;
}
