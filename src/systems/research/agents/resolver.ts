import { join } from 'path';
import fs from 'fs/promises';
import { agent, type LLMHandle } from 'volcano-sdk';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import type { Candidate } from './extractor.js';
import { getArtifactFilename } from '../utils/naming.js';

interface Resolution {
    candidate_name: string;
    action: 'MERGE' | 'CREATE';
    target_id: string | null;
    reason: string;
}

export async function runResolver(
    llm: LLMHandle,
    candidates: Candidate[],
    vaultDir: string,
    logger: RunLogger
): Promise<Map<string, string>> {
    // 1. Build Vault Index
    // In a real system, use an index file. Here, we scan directories.
    const typeDirs = ['concepts', 'principles', 'procedures', 'misconceptions'];
    const vaultIndex: { name: string; id: string; type: string }[] = [];

    for (const type of typeDirs) {
        const dir = join(vaultDir, type);
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (!file.endsWith('.md')) continue;
                const content = await fs.readFile(join(dir, file), 'utf-8');

                // Extract ID and Title (Name)
                const idMatch = content.match(/^id:\s*(.+)$/m);
                // Title is first line usually: # Title
                const titleMatch = content.match(/^#\s+(.+)$/m);

                if (idMatch && titleMatch) {
                    vaultIndex.push({
                        name: titleMatch[1].trim(),
                        id: idMatch[1].trim(),
                        type: type.slice(0, -1) // remove 's'
                    });
                }
            }
        } catch (e) {
            // ignore if dir missing
        }
    }

    if (vaultIndex.length === 0) {
        await logger.log('Vault is empty. All candidates will be created.', 'DEBUG');
        return new Map(); // Empty map means create everything
    }

    // 2. Prepare Prompt
    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-resolve-entities.md');
    const indexString = vaultIndex.map(i => `- [${i.type}] ${i.name} (ID: ${i.id})`).join('\n');
    const candidatesString = candidates.map(c => `- [${c.type}] ${c.name}`).join('\n');

    const prompt = await renderPrompt(promptPath, {
        vault_index: indexString,
        candidates: candidatesString
    });

    await logger.log(`[prompt-resolve-entities.md]:\n${prompt}`, 'DEBUG');


    // 3. Run LLM
    const result = await agent({ llm, name: 'Resolver' })
        .then({ prompt })
        .run();

    const output = result[0]?.llmOutput || "";
    await logger.debug(`[Resolver Output]:\n${output}`);

    // 4. Parse
    const resolutionMap = new Map<string, string>(); // Candidate Name -> Target ID

    try {
        // Extract JSON
        const jsonMatch = output.match(/\[[\s\S]*\]/) || output.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');

        const parsed = JSON.parse(jsonMatch[0]);
        const resolutions = parsed.resolutions || parsed; // Handle list or object wrapper

        if (Array.isArray(resolutions)) {
            for (const res of resolutions) {
                if (res.action === 'MERGE' && res.target_id) {
                    resolutionMap.set(res.candidate_name, res.target_id);
                    await logger.log(`Resolution: "${res.candidate_name}" detected as duplicate of "${res.target_id}" -> merging.`, 'INFO');
                }
            }
        }
    } catch (e) {
        await logger.log(`Resolver failed to parse JSON. Defaulting to CREATE for all. Error: ${e}`, 'WARN');
    }

    return resolutionMap;
}
