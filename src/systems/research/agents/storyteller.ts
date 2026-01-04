import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';

export async function runStoryteller(
    llm: LLMHandle,
    targetConcept: string,
    vaultDir: string,
    logger: RunLogger,
    targetId?: string // New optional arg
): Promise<string> {
    await logger.log(`Starting Storyteller for target: ${targetConcept} (ID: ${targetId || 'new'})`);

    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-storyteller-v1.md');

    // Read Index to find canonical title if ID is provided
    let canonicalTitle = targetConcept;
    let related = "Concepts available: (Index not read)";

    try {
        const { readFile } = await import('node:fs/promises');
        const indexPath = join(vaultDir, '_index', 'notes.json');
        const indexContent = await readFile(indexPath, 'utf-8');
        const notes = JSON.parse(indexContent);

        // If we have a targetId, look up the canonical title (Name)
        if (targetId) {
            const match = notes.find((n: any) => n.id === targetId);
            if (match) {
                canonicalTitle = match.title;
                await logger.log(`Canonical title found: ${canonicalTitle} for ID ${targetId}`, 'DEBUG');
            }
        }

        // Filter for concepts
        const concepts = notes.filter((n: any) => n.type === 'concept').map((n: any) => `- ${n.title} (${n.id})`).join('\n');
        related = concepts;
    } catch (e) {
        // ignore
    }

    const prompt = await renderPrompt(promptPath, {
        objective_name: canonicalTitle,
        related_concepts_list: related
    });

    const result = await agent({ llm, name: 'Storyteller' })
        .then({ prompt })
        .run();

    await logger.log(`[prompt-storyteller-v1.md]:\n${prompt}`, 'DEBUG');

    const storyContent = result[0]?.llmOutput || '';

    if (storyContent) {
        // Use ID for filename if available, otherwise slugify name
        let slug;
        if (targetId) {
            // targetId is usually 'concept-slug'. We can use it directly or prefix it.
            // Let's us 'story-<targetId>.md' -> 'story-concept-slug.md'
            // This guarantees uniqueness per concept.
            slug = targetId;
        } else {
            slug = targetConcept.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        // If targetId started with 'concept-', removing it might be cleaner? 
        // But 'story-concept-foo' is fine.
        const filename = `story-${slug}.md`;

        const { writeFile, mkdir } = await import('node:fs/promises');

        await mkdir(join(vaultDir, 'stories'), { recursive: true });
        const outputPath = join(vaultDir, 'stories', filename);

        // Add YAML
        const finalContent = `---
id: story-${slug}
type: story
target: [[${canonicalTitle}]]
tags: [story, generated]
---
${storyContent}`;

        await writeFile(outputPath, finalContent);
        await logger.log(`Created story: ${outputPath}`);
        return outputPath;
    }

    return '';
}
