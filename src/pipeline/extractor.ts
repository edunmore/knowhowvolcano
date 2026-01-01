/**
 * Extractor - Extract Method Kernel, Delivery Model, and Reuse Pack
 * 
 * Uses file-reference prompts - the LLM reads files directly instead of 
 * us embedding content in the prompt.
 */

import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { ExtractionDoc } from './types.js';

const EXTRACTOR_PROMPT = readFileSync(
    new URL('../../PROMPTS/02_EXTRACTOR_MULTI.md', import.meta.url),
    'utf-8'
);

/**
 * Build the extraction prompt with file references (not embedded content)
 */
function buildExtractionPrompt(filePaths: string[]): string {
    // Replace placeholders in prompt template
    let prompt = EXTRACTOR_PROMPT;

    // Replace file placeholders with basenames
    for (let i = 0; i < 4; i++) {
        const placeholder = `<FILE_${i + 1}>`;
        const replacement = filePaths[i]
            ? basename(filePaths[i])
            : '(not provided)';
        prompt = prompt.replace(placeholder, replacement);
    }

    // Build file reference list with absolute paths
    const fileList = filePaths
        .map((p, i) => `${i + 1}. ${resolve(p)}`)
        .join('\n');

    return `${prompt}

---
SOURCE FILES TO READ:
---

Please read and analyze the following files:
${fileList}

Read each file, then perform the extraction following the rules above.`;
}

/**
 * Run the extraction process
 * Note: The LLM will read the files directly using its file-reading capability
 */
export async function extract(
    llm: LLMHandle,
    selectedFiles: string[]
): Promise<ExtractionDoc> {
    // Build prompt with file references (no content embedding)
    const prompt = buildExtractionPrompt(selectedFiles);

    // Run extraction - LLM reads files via its tools
    const results = await agent({ llm })
        .then({ prompt })
        .run();

    const rawMarkdown = results[0]?.llmOutput || '';

    // Parse the structured output (simplified - full parsing would be more complex)
    return {
        methodKernel: {
            purpose: [],
            preconditions: [],
            roles: [],
            process: [],
            decisionRules: [],
            successSignals: [],
            failureModes: [],
            dosDonts: [],
        },
        authorDeliveryModel: {
            teachingStrategy: [],
            persuasionMoves: [],
            framingContrasts: [],
            keyPhrases: [],
            questionPatterns: [],
        },
        reusePack: {
            metaphors: [],
            microScenarios: [],
            storyBeats: [],
            fableSpec: '',
        },
        qualityGateReport: '',
        rawMarkdown,
    };
}
