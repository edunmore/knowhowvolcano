import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import { withRateLimitRetry } from '../utils/rate-limit-utils.js';

export interface Candidate {
    type: 'concept' | 'procedure' | 'principle' | 'misconception';
    name: string;
    quote: string;
    reason: string;
}

export async function runExtractor(
    llm: LLMHandle,
    sourceText: string,
    sourceTitle: string,
    vaultDir: string,
    logger: RunLogger
): Promise<Candidate[]> {
    await logger.log(`Starting Extractor for: ${sourceTitle}`);

    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-extract-candidates.md');

    // Render the prompt
    const prompt = await renderPrompt(promptPath, {
        source_title: sourceTitle,
        source_text: sourceText
    });

    await logger.log(`[prompt-extract-candidates.md]:\n${prompt}`, 'DEBUG');

    // Log input size for visibility
    const inputChars = prompt.length;
    await logger.log(`[Extractor] ${sourceTitle} | input: ${(inputChars / 1024).toFixed(1)}kb (~${Math.round(inputChars / 4)} tokens)`);

    // Wrap LLM call with rate limit retry
    const result = await withRateLimitRetry(
        async () => agent({ llm, name: 'Extractor' }).then({ prompt }).run(),
        {
            maxRetries: 3,
            baseDelayMs: 2000,
            onRetry: async (attempt, delayMs) => {
                await logger.log(`[RateLimit] Extractor hit rate limit, waiting ${delayMs}ms before retry ${attempt}/3`, 'WARN');
            }
        }
    );

    const rawOutput = result[0]?.llmOutput || '[]';
    await logger.debug(`[Extractor Raw Output]:\n${rawOutput}`);

    // Helper to clean Markdown code blocks to ensure JSON parse
    const cleanJson = rawOutput.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    try {
        const candidates = JSON.parse(cleanJson) as Candidate[];
        await logger.log(`Extracted ${candidates.length} candidates.`);
        return candidates;
    } catch (e: any) {
        await logger.log(`Failed to parse candidates JSON: ${e.message}`, 'ERROR');
        await logger.log(`Raw output: ${rawOutput}`, 'ERROR');
        return [];
    }
}
