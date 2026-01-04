import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import fs from 'node:fs/promises';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import type { Candidate } from './extractor.js';
import { getArtifactId, getArtifactFilename } from '../utils/naming.js';

export async function runModeler(
    llm: LLMHandle,
    candidate: Candidate,
    sourceContext: string,
    sourceId: string,
    vaultDir: string,
    logger: RunLogger,
    critique?: string,
    existingContent?: string
): Promise<{ output: string; filename: string } | null> {
    const mode = existingContent ? 'MERGE' : 'CREATE';
    await logger.log(`Modeling candidate: ${candidate.name} (${candidate.type}) [${mode}]${critique ? ' [RETRY]' : ''}`);

    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-model-artifact.md');
    const artifactId = getArtifactId(candidate.name, candidate.type);
    const filename = getArtifactFilename(candidate.name, candidate.type);

    const prompt = await renderPrompt(promptPath, {
        artifact_type: candidate.type,
        artifact_name: candidate.name,
        artifact_id: artifactId,
        source_context: sourceContext,
        source_id: sourceId,
        critique: critique || '',
        existing_content: existingContent || ''
    });

    await logger.log(`[prompt-model-artifact.md - ${candidate.name}]:\n${prompt}`, 'DEBUG');

    const result = await agent({ llm, name: 'Modeler' })
        .then({ prompt })
        .run();

    const resultLog = result[0]?.llmOutput || "";
    await logger.debug(`[Modeler Raw Output]:\n${resultLog}`);

    const noteContent = result[0]?.llmOutput;

    if (!noteContent) {
        await logger.log(`Modeler failed to generate content for ${candidate.name}`, 'WARN');
        return null;
    }

    // Add cleaner to remove potential markdown wrapping if LLM is chatty
    let cleanContent = noteContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');

    // Force the correct ID in frontmatter if needed (or just trust the LLM used the var)
    // For robustness, we could regex replace the ID, but let's assume LLM follows orders for now.

    return {
        output: cleanContent,
        filename
    };
}
