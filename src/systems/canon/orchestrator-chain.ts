/**
 * Orchestrator Chain POC - Chainable Workflows with Volcano SDK v1.1.0
 */

import { resolve } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle, StepResult } from 'volcano-sdk';
import { loadPromptWithValues } from './prompt-loader.js';
import { routeChapters } from './router.js';
import { loadCanonIndex } from './canon-matcher.js';
import type { RunConfig, RunOutput } from './types.js';

export async function runChainPipeline(
    llm: LLMHandle,
    config: RunConfig
): Promise<RunOutput | any> {
    console.log('=== Running Chainable Pipeline POC ===');

    // Step 0: Route (Procedural, as it determines the inputs for the chain)
    // In a fully agentic world, this could be a 'Planning' step.
    const canonIndexPath = resolve(config.canonDir, 'METHODS-CANON-INDEX.md');
    const canonIndex = loadCanonIndex(canonIndexPath);

    console.log('Step 0: Routing...');
    const routerResult = await routeChapters(
        llm,
        config.sourceDir,
        config.startFile,
        canonIndex,
        config.maxFiles || 2
    );

    const selectedFiles = routerResult.selectedFiles;
    const fileList = selectedFiles.map((p, i) => `${i + 1}. ${resolve(p)}`).join('\n');
    console.log(`Selected ${selectedFiles.length} files.`);

    // === Chainable Workflow ===
    // We define a single agent execution that chains Extraction -> Critique

    const results = await agent({ llm, name: 'CanonChainAgent' })
        // Step 1: Extraction
        .then({
            name: 'Extraction',
            prompt: loadPromptWithValues('EXTRACTOR_MULTI', {
                sourceFiles: fileList,
            })
        })
        // Step 2: Critique (Dynamic Step based on Extraction output)
        .then((history: StepResult[]) => {
            console.log('Step 1 Complete. Preparing Critique...');

            // Get output from Step 1 (Extraction)
            // history[0] is Step 1 result
            const extractionMarkdown = history[0].llmOutput || '';

            return {
                name: 'Critique',
                prompt: loadPromptWithValues('DOWNSTREAM_CRITIC', {
                    sourceFiles: `Please read these source files:\n${fileList}`,
                    extraction: extractionMarkdown,
                })
            };
        })
        .run({
            onStep: (step, index) => {
                console.log(`Step ${index + 1} (${step.prompt?.slice(0, 50)}...) completed in ${step.durationMs}ms`);
            }
        });

    console.log('=== Chain Complete ===');

    const extractionResult = results[0];
    const critiqueResult = results[1];

    console.log('\n--- Extraction Output (Preview) ---');
    console.log(extractionResult.llmOutput?.substring(0, 200) + '...');

    console.log('\n--- Critique Output (Preview) ---');
    console.log(critiqueResult.llmOutput?.substring(0, 200) + '...');

    return {
        runId: 'POC-CHAIN',
        timestamp: new Date().toISOString(),
        config,
        provider: llm.id,
        routerResult,
        pipeline_results: results
    };
}
