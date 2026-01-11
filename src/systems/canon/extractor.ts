/**
 * Extractor - Extract Method Kernel, Delivery Model, and Reuse Pack
 * 
 * Uses file-reference prompts - the LLM reads files directly instead of 
 * us embedding content in the prompt.
 * 
 * All prompts loaded from PROMPTS folder - no hardcoded prompts.
 */

import { resolve } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { ExtractionDoc } from './types.js';
import { loadPromptWithValues } from './prompt-loader.js';

/**
 * Run the extraction process
 * Note: The LLM will read the files directly using its file-reading capability
 */
export async function extract(
    llm: LLMHandle,
    selectedFiles: string[]
): Promise<ExtractionDoc> {
    // Build file reference list with absolute paths
    const fileList = selectedFiles
        .map((p, i) => `${i + 1}. ${resolve(p)}`)
        .join('\n');

    // Load prompt from external file - NO hardcoded prompts
    const prompt = loadPromptWithValues('EXTRACTOR_MULTI', {
        sourceFiles: fileList,
    });

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
