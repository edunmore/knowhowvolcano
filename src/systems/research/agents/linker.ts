import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import fs from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';

interface LinkReference {
    sourceFile: string;
    targetName: string; // The text inside [[...]]
    context: string; // Surrounding text
}

export async function runLinker(
    llm: LLMHandle,
    vaultDir: string,
    logger: RunLogger
) {
    await logger.log('Starting Linker: Resolving links and creating stubs...');

    // 1. Scan all notes to find existing IDs and filenames
    const existingFiles = new Set<string>();
    const noteFiles: string[] = [];

    async function scan(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('_')) await scan(fullPath);
            } else if (entry.name.endsWith('.md')) {
                existingFiles.add(entry.name); // simplistic match by filename
                // Also add naive ID (filename without ext)
                existingFiles.add(entry.name.replace(/\.md$/, ''));
                noteFiles.push(fullPath);
            }
        }
    }

    await scan(vaultDir);
    await logger.log(`Found ${existingFiles.size} existing addressable targets.`);

    // 2. Scan for broken links
    const brokenLinks: LinkReference[] = [];
    const linkRegex = /\[\[([^\]]+)\]\]/g;

    for (const file of noteFiles) {
        const content = await fs.readFile(file, 'utf-8');
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const target = match[1].split('|')[0].trim(); // Handle aliases [[Target|Alias]]
            if (!target) continue;

            // Check if exists
            // We do a loose check: does target exist as filename or part of filename?
            // In a real Zettel, we'd have a stronger ID index.
            // Here, we assume filename matching.

            // Normalization: clean whitespace, maybe dashes
            // naive check
            const targetFound = [...existingFiles].some(f => f === target || f === `${target}.md` || f.includes(target));

            if (!targetFound) {
                // Extracts ~100 chars context
                const start = Math.max(0, match.index - 50);
                const end = Math.min(content.length, match.index + 50);
                const context = content.slice(start, end).replace(/\n/g, ' ');

                brokenLinks.push({
                    sourceFile: file,
                    targetName: target,
                    context
                });
            }
        }
    }

    // Deduplicate broken targets
    const uniqueBroken = new Map<string, LinkReference>();
    for (const link of brokenLinks) {
        if (!uniqueBroken.has(link.targetName)) {
            uniqueBroken.set(link.targetName, link);
        }
    }

    await logger.log(`Found ${uniqueBroken.size} missing link targets.`);

    // 3. Create Stubs for missing targets
    for (const [targetName, link] of uniqueBroken) {
        // Skip sources or strange links
        if (targetName.startsWith('http')) continue;

        await logger.log(`Creating stub for: ${targetName}`);

        const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-create-stub.md');
        const prompt = await renderPrompt(promptPath, {
            concept_name: targetName,
            context_usage: link.context
        });

        const result = await agent({ llm, name: 'Linker-Stubber' })
            .then({ prompt })
            .run();

        await logger.log(`[prompt-create-stub.md]:\n${prompt}`, 'DEBUG');

        const output = result[0]?.llmOutput;
        if (output) {
            const cleanOutput = output.replace(/^```markdown\n/, '').replace(/\n```$/, '');

            // Generate filename from ID or slug
            const idMatch = cleanOutput.match(/id:\s*([a-z0-9-_]+)/);
            let id = idMatch ? idMatch[1] : '';
            if (!id) {
                id = `concept-${targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            }

            // Stubs go to concepts by default in MVP
            const stubPath = join(vaultDir, 'concepts', `${id}.md`);

            // Check if we accidentally created it already in this loop
            if (!existingFiles.has(id)) {
                await fs.writeFile(stubPath, cleanOutput);
                await logger.log(`Stub created: ${stubPath}`);
                existingFiles.add(id); // Prevent dupes immediately
            }
        }
    }

    return uniqueBroken.size;
}
