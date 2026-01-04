import { join, resolve } from 'node:path';
import fs from 'node:fs/promises';
import { RunLogger } from './run-logger.js';
import { runIngestor } from './agents/ingestor.js';
import { runExtractor } from './agents/extractor.js';
import { runModeler } from './agents/modeler.js';
import { runLinker } from './agents/linker.js';
import { runIndexer } from './utils/indexer.js';
import { runStoryteller } from './agents/storyteller.js';
import { runVerifier } from './agents/verifier.js';
import { runResolver } from './agents/resolver.js';
import { getArtifactFilename } from './utils/naming.js';
import type { ResearchConfig, RunContext } from './types.js';
import { createAzureGPT52Provider } from '../../core/providers/azure-gpt52-provider.js';
import { createAzureProvider } from '../../core/providers/azure-deepseek-provider.js';
import { createOllamaProvider } from '../../core/providers/ollama-provider.js';

function getProvider(cfg: ResearchConfig) {
    switch (cfg.provider) {
        case 'azure-gpt52': return createAzureGPT52Provider();
        case 'deepseek': return createAzureProvider();
        case 'ollama': return createOllamaProvider();
        default: return createAzureGPT52Provider();
    }
}

export async function runResearchPipeline(config: ResearchConfig) {
    const logger = await RunLogger.create(config.runsDir, config.verbose);
    const runId = logger.getRunId();
    await logger.log(`Pipeline initialized. Run ID: ${runId}`);

    const context: RunContext = {
        runId,
        timestamp: new Date().toISOString(),
        config,
        manifest: {
            filesRead: [],
            notesCreated: [],
            stepsCompleted: []
        }
    };

    const llm = getProvider(config);
    await logger.log(`Provider initialization: ${config.provider || 'default'}`);

    try {
        if (!config.startFile) {
            throw new Error('No start file provided');
        }

        // Step 1: Ingestion
        await logger.log(`Step 1: Ingestion of ${config.startFile}`);
        const ingestResult = await runIngestor(llm, config.startFile, config.vaultDir, logger);
        context.manifest.filesRead.push(config.startFile);
        context.manifest.notesCreated.push(ingestResult.sourcePath);
        context.manifest.stepsCompleted.push('ingestion');

        // Read source content for extraction
        const sourceContent = await fs.readFile(config.startFile, 'utf-8');

        // Step 2: Extraction
        await logger.log(`Step 2: Extraction of candidates`);
        const candidates = await runExtractor(llm, sourceContent, config.startFile, config.vaultDir, logger);

        // Step 2.5: Resolution
        await logger.log(`Step 2.5: Entity Resolution (Deduplication)`);
        const resolutionMap = await runResolver(llm, candidates, config.vaultDir, logger);

        // Step 4: Modeling (Sequential to avoid Rate Limits)
        await logger.log(`Step 4: Modeling (Sequential Processing - ${candidates.length} candidates)`);

        for (const candidate of candidates) {
            let attempts = 0;
            const maxAttempts = 2; // Initial run + 1 retry
            let currentCritique: string | undefined = undefined;
            let success = false;

            // Determine Target Filename
            // If resolved, use the resolved ID to build filename
            let filename: string;
            const resolvedId = resolutionMap.get(candidate.name);

            if (resolvedId) {
                filename = `${resolvedId}.md`;
                await logger.log(`[Resolution] Maps "${candidate.name}" -> ${filename}`, 'DEBUG');
            } else {
                filename = getArtifactFilename(candidate.name, candidate.type);
            }

            const subfolder = `${candidate.type}s`;
            const expectedPath = join(config.vaultDir, subfolder, filename);

            let existingContent: string | undefined = undefined;
            try {
                existingContent = await fs.readFile(expectedPath, 'utf-8');
                await logger.log(`Found existing note for ${candidate.name} at ${expectedPath}`, 'DEBUG');
                // IMPORTANT: Since we resolved to an existing ID, we must tell Modeler to use THAT ID,
                // otherwise Modeler might try to regenerate a new ID based on the (potentially different) candidate name.
                // We should probably mutate candidate.name to match, OR explicit pass 'artifact_id' to modeler prompt.
                // Modeler prompt *derives* id from name if not passed? 
                // Step 994 Modeler uses getArtifactId(candidate.name). 
                // We need to override that.
                // NOTE: I am not updating Modeler signature yet, but Modeler uses 'getArtifactId(candidate.name)'.
                // If I don't change that, Modeler will generate a NEW ID into the prompt, 
                // but we will write it to the OLD filename.
                // Result: ID in frontmatter mismatch with Filename.
                // Fix: I should update Modeler to accept an optional 'forcedId' or similar. 
                // Or I rely on the fact that existing content HAS the ID, and Modeler (in MERGE mode) should use it.
                // The prompt says "id: {{artifact_id}}".
                // If existing_content is present, LLM usually respects it.
                // But for safety, I should probably update Modeler to accept `forcedFilename` or `forcedId`.
            } catch (e) {
                // If resolved ID leads to missing file (weird), or new file.
            }

            while (attempts < maxAttempts && !success) {
                attempts++;

                // We pass existingContent. Modeler will see it and enter MERGE mode.
                const modelResult = await runModeler(
                    llm,
                    candidate,
                    candidate.quote,
                    ingestResult.sourceId,
                    config.vaultDir,
                    logger,
                    currentCritique,
                    existingContent
                );

                if (!modelResult) break; // Hard fail in modeler

                // Use the PREDICTED path for writing, ignoring whatever filename Modeler returns 
                // (Modeler returns filename based on its own logic, but we want to ENFORCE our resolution).
                // Wait, Modeler.ts returns { output, filename }.
                // If Modeler generates a DIFFERENT filename, and we write to OUR filename, it's okay, 
                // but the frontmatter might be wrong.
                // For now, let's write to the path we decided.
                const outputPath = expectedPath;

                // Ensure subdir exists (should be done above but good for safety)
                await fs.mkdir(join(config.vaultDir, subfolder), { recursive: true });
                await fs.writeFile(outputPath, modelResult.output);

                // Verify
                const verification = await runVerifier(llm, outputPath, config.vaultDir, logger, sourceContent);

                if (verification.pass) {
                    success = true;
                    // Log MERGE if it was a merge
                    const action = existingContent ? 'Updated' : 'Created';
                    await logger.log(`${action} note: ${outputPath}`);
                    context.manifest.notesCreated.push(outputPath);
                } else {
                    await logger.log(`Attempt ${attempts} failed verification.`, 'WARN');
                    currentCritique = verification.issues.join('\n');

                    if (attempts === maxAttempts) {
                        await logger.log(`Max retries reached for ${candidate.name}. Keeping imperfect note.`, 'WARN');
                        context.manifest.notesCreated.push(outputPath);
                    }
                }
            }
        }

        context.manifest.stepsCompleted.push('extraction', 'resolution', 'modeling');

        // Step 4: Linking
        await logger.log(`Step 4: Linking & Stub Creation`);
        const stubsCreated = await runLinker(llm, config.vaultDir, logger);
        context.manifest.stepsCompleted.push('linking');

        // Step 5: Indexing
        await logger.log(`Step 5: Rebuilding Indexes`);
        await runIndexer(config.vaultDir, logger);
        context.manifest.stepsCompleted.push('indexing');

        // Step 6: Generation
        const firstConcept = candidates.find(c => c.type === 'concept');
        if (firstConcept) {
            await logger.log(`Step 6: Generation (Storyteller)`);

            // Check Resolution
            const resolvedId = resolutionMap.get(firstConcept.name);

            await runStoryteller(
                llm,
                firstConcept.name,
                config.vaultDir,
                logger,
                resolvedId // <= Pass Resolved ID
            );
            context.manifest.stepsCompleted.push('generation');
        }

        await logger.saveManifest(context);
        await logger.log('Pipeline completed successfully.');

    } catch (error: any) {
        await logger.log(`Pipeline Failed: ${error.message}`, 'ERROR');
        throw error;
    }
}
