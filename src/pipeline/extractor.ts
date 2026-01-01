/**
 * Extractor - Extract Method Kernel, Delivery Model, and Reuse Pack
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { ExtractionDoc, SourceDocument } from './types.js';
import { loadSourceFiles, formatSourcesForPrompt } from './source-store.js';

const EXTRACTOR_PROMPT = readFileSync(
    new URL('../../PROMPTS/02_EXTRACTOR_MULTI.md', import.meta.url),
    'utf-8'
);

/**
 * Build the extraction prompt with source files injected
 */
function buildExtractionPrompt(sources: SourceDocument[]): string {
    // Replace placeholders in prompt template
    let prompt = EXTRACTOR_PROMPT;

    // Replace file placeholders
    for (let i = 0; i < 4; i++) {
        const placeholder = `<FILE_${i + 1}>`;
        const replacement = sources[i]
            ? basename(sources[i].path)
            : '(not provided)';
        prompt = prompt.replace(placeholder, replacement);
    }

    // Add source content
    const sourceContent = formatSourcesForPrompt(sources);

    return `${prompt}

---
SOURCE FILES CONTENT:
---

${sourceContent}

---
END OF SOURCES. Now perform the extraction following the rules above.`;
}

/**
 * Run the extraction process
 */
export async function extract(
    llm: LLMHandle,
    selectedFiles: string[]
): Promise<ExtractionDoc> {
    // Load source files
    const sources = loadSourceFiles(selectedFiles);

    // Build prompt
    const prompt = buildExtractionPrompt(sources);

    // Run extraction
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
