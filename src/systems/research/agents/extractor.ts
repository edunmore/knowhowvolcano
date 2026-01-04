import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';

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
        source_text: sourceText
    });

    await logger.log(`[prompt-extract-candidates.md]:\n${prompt}`, 'DEBUG');

    const result = await agent({ llm, name: 'Extractor' })
        .then({ prompt })
        .run();

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
