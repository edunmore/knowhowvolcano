import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import fs from 'node:fs/promises';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import type { Candidate } from './extractor.js';
import { getArtifactId, getArtifactFilename } from '../utils/naming.js';
import { withRateLimitRetry } from '../utils/rate-limit-utils.js';

export interface ModelerOptions {
    sourceTitle?: string;  // Human-readable source name
    chunkId?: string;      // Which chunk this came from
}

export async function runModeler(
    llm: LLMHandle,
    candidate: Candidate,
    sourceContext: string,
    sourceId: string,
    vaultDir: string,
    logger: RunLogger,
    critique?: string,
    existingContent?: string,
    options?: ModelerOptions
): Promise<{ output: string; filename: string } | null> {
    const mode = existingContent ? 'MERGE' : 'CREATE';
    await logger.log(`Modeling candidate: ${candidate.name} (${candidate.type}) [${mode}]${critique ? ' [RETRY]' : ''}`);

    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-model-artifact.md');
    const artifactId = getArtifactId(candidate.name, candidate.type);
    const filename = getArtifactFilename(candidate.name, candidate.type);

    // Extract source title from source anchor if not provided
    let sourceTitle = options?.sourceTitle;
    if (!sourceTitle) {
        try {
            const sourceAnchorPath = join(vaultDir, 'sources', `source-${sourceId.replace('src_', '')}.md`);
            const anchorContent = await fs.readFile(sourceAnchorPath, 'utf-8');
            const titleMatch = anchorContent.match(/^# (.+)$/m);
            sourceTitle = titleMatch ? titleMatch[1] : undefined;
        } catch {
            // Fall back to extracting from source ID
            sourceTitle = sourceId.replace(/^src_[a-f0-9]+_?/, '').replace(/-/g, ' ') || 'Source Document';
        }
    }

    const prompt = await renderPrompt(promptPath, {
        artifact_type: candidate.type,
        artifact_name: candidate.name,
        artifact_id: artifactId,
        source_context: sourceContext,
        source_id: sourceId,
        source_title: sourceTitle || 'Source Document',
        chunk_id: options?.chunkId || '',
        critique: critique || '',
        existing_content: existingContent || ''
    });

    await logger.log(`[prompt-model-artifact.md - ${candidate.name}]:\n${prompt}`, 'DEBUG');

    // Log input size for visibility
    const inputChars = prompt.length;
    await logger.log(`[Modeler] ${candidate.name} (${candidate.type}) | input: ${(inputChars / 1024).toFixed(1)}kb (~${Math.round(inputChars / 4)} tokens)`);

    // Wrap LLM call with rate limit retry
    const result = await withRateLimitRetry(
        async () => agent({ llm, name: 'Modeler' }).then({ prompt }).run(),
        {
            maxRetries: 3,
            baseDelayMs: 2000,
            onRetry: async (attempt, delayMs) => {
                await logger.log(`[RateLimit] Modeler hit rate limit, waiting ${delayMs}ms before retry ${attempt}/3`, 'WARN');
            }
        }
    );

    const resultLog = result[0]?.llmOutput || "";
    await logger.debug(`[Modeler Raw Output]:\n${resultLog}`);

    const noteContent = result[0]?.llmOutput;

    if (!noteContent) {
        await logger.log(`Modeler failed to generate content for ${candidate.name}`, 'WARN');
        return null;
    }

    // Add cleaner to remove potential markdown wrapping if LLM is chatty
    let cleanContent = noteContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');

    return {
        output: cleanContent,
        filename
    };
}

