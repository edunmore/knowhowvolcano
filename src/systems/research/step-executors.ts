/**
 * Step Executors - Register all step type handlers for runbooks
 * 
 * This module registers handlers for each step type that can be used in runbooks.
 * Each handler receives the step definition, inputs, vault directory, LLM handle, and logger.
 * 
 * All executors call REAL agents from src/systems/research/agents/
 */

import fs from 'node:fs/promises';
import { join } from 'node:path';
import { registerStepExecutor } from './runbook-runner.js';
import { splitIntoChunks, writeChunksToVault, generateSourceId } from './utils/chunker.js';
import type { RunbookStep } from './runbook-loader.js';
import type { RunLogger } from './run-logger.js';
import type { LLMHandle } from 'volcano-sdk';

// Import real agents
import { runIngestor } from './agents/ingestor.js';
import { runExtractor, type Candidate } from './agents/extractor.js';
import { runModeler } from './agents/modeler.js';
import { runVerifier } from './agents/verifier.js';
import { runResolver } from './agents/resolver.js';
import { runLinker } from './agents/linker.js';
import { runIndexer } from './utils/indexer.js';
import { runStoryteller } from './agents/storyteller.js';
import { resolveLinksInVault } from './agents/link-resolver.js';
import { getArtifactFilename } from './utils/naming.js';
import { logVerificationFailure } from './utils/failure-log.js';

/**
 * Echo step - simple test step that echoes a message
 */
registerStepExecutor('echo', async (step, inputs, vaultDir, llm, logger) => {
    const message = inputs.message || step.inputs?.message || 'Echo!';
    await logger?.log(`[Echo] ${message}`);
    return {
        success: true,
        outputs: {
            echoed: message,
            timestamp: new Date().toISOString()
        }
    };
});

/**
 * Ingest step - ingest source file and create source anchor
 */
registerStepExecutor('ingest', async (step, inputs, vaultDir, llm, logger) => {
    const file = inputs.file;
    if (!file) {
        return { success: false, outputs: { error: 'No file specified for ingest' } };
    }

    try {
        await logger?.log(`[Ingest] Processing ${file}`);
        const result = await runIngestor(llm, file, vaultDir, logger!);

        return {
            success: true,
            outputs: {
                sourceId: result.sourceId,
                sourcePath: result.sourcePath,
                rawPath: result.rawPath,
                contentHash: result.contentHash
            }
        };
    } catch (error: any) {
        await logger?.log(`[Ingest] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Chunk step - split file(s) into chunks and store in vault
 */
registerStepExecutor('chunk', async (step, inputs, vaultDir, llm, logger) => {
    const file = inputs.file;
    const dir = inputs.dir;
    const chunkSize = inputs.chunkSize || 4000;
    const minChunk = inputs.minChunk || 800;

    await logger?.log(`[Chunk] Inputs: file=${file}, dir=${dir}, chunkSize=${chunkSize}`, 'DEBUG');

    if (!file && !dir) {
        return {
            success: false,
            outputs: { error: 'No file or dir specified for chunking' }
        };
    }

    try {
        let totalChunks = 0;
        let totalFiles = 0;
        const manifests: any[] = [];
        let sourceId = '';
        let sourceContent = '';

        if (file) {
            // Single file chunking
            await logger?.log(`[Chunk] Reading file: ${file}`);
            const content = await fs.readFile(file, 'utf-8');
            sourceId = generateSourceId(content);
            sourceContent = content;

            await logger?.log(`[Chunk] Processing ${file} (${content.length} chars) → ${sourceId}`);

            const chunks = splitIntoChunks(content, sourceId, {
                targetChunkChars: chunkSize,
                minChunkChars: minChunk,
            });

            await logger?.log(`[Chunk] Split into ${chunks.length} chunks, writing to vault...`);
            const manifest = await writeChunksToVault(vaultDir, sourceId, file, chunks);
            manifests.push(manifest);
            totalChunks += chunks.length;
            totalFiles += 1;

            await logger?.log(`[Chunk] Created ${chunks.length} chunks in ${vaultDir}/_sources/${sourceId}/`);
        }

        if (dir) {
            // Directory chunking - TODO: implement multi-file combination
            await logger?.log(`[Chunk] Directory chunking not yet implemented: ${dir}`);
        }

        return {
            success: true,
            outputs: {
                totalChunks,
                totalFiles,
                manifests,
                chunkSize,
                sourceId,
                sourceContent  // Pass content for subsequent steps
            }
        };
    } catch (error: any) {
        const errorMessage = error?.message || String(error) || 'Unknown error';
        await logger?.log(`[Chunk] Error: ${errorMessage}`, 'ERROR');
        return {
            success: false,
            outputs: { error: errorMessage }
        };
    }
});

/**
 * Gate step - run chunk gate to classify chunks
 */
registerStepExecutor('gate', async (step, inputs, vaultDir, llm, logger) => {
    const chunksInput = inputs.chunks;
    if (!chunksInput) {
        return {
            success: false,
            outputs: { error: 'No chunks specified for gating' }
        };
    }

    // Import gate utilities and chunk loader
    const { gateChunks } = await import('./agents/chunk-gate.js');
    const { loadSourceChunks, writeSourceChunk } = await import('./utils/chunk-loader.js');

    // Find most recent source ID
    const sourcesDir = join(vaultDir, '_sources');
    const sources = await fs.readdir(sourcesDir);
    const sourceId = sources.filter(s => s.startsWith('src_')).sort().reverse()[0];

    if (!sourceId) {
        return {
            success: false,
            outputs: { error: 'No source chunks found for gating' }
        };
    }

    await logger?.log(`[Gate] Loading chunks from source: ${sourceId}`);
    const loadedChunks = await loadSourceChunks(vaultDir, sourceId);
    await logger?.log(`[Gate] Loaded ${loadedChunks.length} chunks, running Azure GPT-5-nano gate...`);

    // Convert to format expected by gateChunks
    const chunks = loadedChunks.map(c => ({ metadata: c.metadata, content: c.content }));

    // Run gate agent on all chunks (uses Azure GPT-5-nano)
    await gateChunks(chunks, vaultDir, logger);

    // Save updated chunk metadata
    for (let i = 0; i < chunks.length; i++) {
        loadedChunks[i].metadata = chunks[i].metadata;
        await writeSourceChunk(loadedChunks[i]);
    }

    // Count decisions
    const counts = { SKIP: 0, LIGHT_SCAN: 0, FULL_MODEL: 0 };
    for (const chunk of chunks) {
        const decision = chunk.metadata.decision as 'SKIP' | 'LIGHT_SCAN' | 'FULL_MODEL' | undefined;
        if (decision && counts[decision] !== undefined) {
            counts[decision]++;
        }
    }

    await logger?.log(`[Gate] Results: FULL_MODEL=${counts.FULL_MODEL}, LIGHT_SCAN=${counts.LIGHT_SCAN}, SKIP=${counts.SKIP}`);
    await logger?.log(`[Gate] Completed: FULL_MODEL=${counts.FULL_MODEL}, LIGHT_SCAN=${counts.LIGHT_SCAN}, SKIP=${counts.SKIP}`);

    return {
        success: true,
        outputs: {
            sourceId,
            gated_chunks: chunks.length,
            full_model: counts.FULL_MODEL,
            light_scan: counts.LIGHT_SCAN,
            skip: counts.SKIP,
        }
    };
});

/**
 * Extract step - extract candidates from source content
 */
registerStepExecutor('extract', async (step, inputs, vaultDir, llm, logger) => {
    // Get source content from previous step or file
    let sourceContent = inputs.sourceContent;
    const file = inputs.file;
    const sourceId = inputs.sourceId;

    if (!sourceContent && file) {
        sourceContent = await fs.readFile(file, 'utf-8');
    }

    if (!sourceContent) {
        return { success: false, outputs: { error: 'No source content for extraction' } };
    }

    try {
        await logger?.log(`[Extract] Running extractor on ${sourceContent.length} chars`);
        const candidates = await runExtractor(llm, sourceContent, file || 'source', vaultDir, logger!);

        await logger?.log(`[Extract] Extracted ${candidates.length} candidates`);

        return {
            success: true,
            outputs: {
                candidates,
                candidateCount: candidates.length,
                sourceContent  // Pass through for modeling
            }
        };
    } catch (error: any) {
        await logger?.log(`[Extract] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Resolve step - resolve candidates against existing vault (deduplication)
 */
registerStepExecutor('resolve', async (step, inputs, vaultDir, llm, logger) => {
    const candidates = inputs.candidates as Candidate[];

    if (!candidates || candidates.length === 0) {
        await logger?.log(`[Resolve] No candidates to resolve`);
        return { success: true, outputs: { resolved: 0, resolutionMapData: {} } };
    }

    try {
        await logger?.log(`[Resolve] Resolving ${candidates.length} candidates against vault`);
        const resolutionMap = await runResolver(llm, candidates, vaultDir, logger!);

        const mergeCount = resolutionMap.size;
        await logger?.log(`[Resolve] Found ${mergeCount} candidates to merge with existing notes`);

        // Convert Map to plain object for serialization in context
        const resolutionMapData: Record<string, string> = {};
        resolutionMap.forEach((value, key) => {
            resolutionMapData[key] = value;
        });

        return {
            success: true,
            outputs: {
                resolved: mergeCount,
                resolutionMapData,  // Plain object, not Map
                candidates  // Pass through
            }
        };
    } catch (error: any) {
        await logger?.log(`[Resolve] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Model step - model notes from extracted candidates
 */
registerStepExecutor('model', async (step, inputs, vaultDir, llm, logger) => {
    const candidates = inputs.candidates as Candidate[];
    // Convert from plain object back to Map (context serializes Maps as objects)
    const resolutionMapData = inputs.resolutionMapData as Record<string, string> || {};
    const resolutionMap = new Map<string, string>(Object.entries(resolutionMapData));
    const sourceContent = inputs.sourceContent as string;
    const sourceId = inputs.sourceId as string || 'unknown';
    const modelDepth = inputs.model_depth || 'standard';

    if (!candidates || candidates.length === 0) {
        await logger?.log(`[Model] No candidates to model`);
        return { success: true, outputs: { notes_created: 0, notes: [] } };
    }

    const notesCreated: string[] = [];
    // Reduced retries: verification failures indicate prompt issues, not retry-worthy errors
    // If failures are common, improve extraction/modeling prompts instead
    const maxRetries = 1;

    await logger?.log(`[Model] Modeling ${candidates.length} candidates (depth: ${modelDepth})`);

    for (const candidate of candidates) {
        let attempts = 0;
        let currentCritique: string | undefined = undefined;
        let success = false;

        // Determine target filename (use resolution if exists)
        const resolvedId = resolutionMap.get(candidate.name);

        // Type validation - block cross-type merges
        if (resolvedId) {
            const resolvedType = resolvedId.split('-')[0];
            if (resolvedType !== candidate.type) {
                await logger?.log(`[Model] Type mismatch: "${candidate.name}" (${candidate.type}) cannot merge with "${resolvedId}" (${resolvedType}). Creating new note.`, 'WARN');
                resolutionMap.delete(candidate.name);
            }
        }

        const validatedResolvedId = resolutionMap.get(candidate.name);
        const filename = validatedResolvedId
            ? `${validatedResolvedId}.md`
            : getArtifactFilename(candidate.name, candidate.type);

        const subfolder = `${candidate.type}s`;
        const expectedPath = join(vaultDir, subfolder, filename);

        // Check for existing content (for merge mode)
        let existingContent: string | undefined = undefined;
        try {
            existingContent = await fs.readFile(expectedPath, 'utf-8');
            await logger?.log(`[Model] Found existing note for ${candidate.name}`, 'DEBUG');
        } catch {
            // New file
        }

        while (attempts < maxRetries && !success) {
            attempts++;

            // Extract context window around the quote
            const contextWindow = extractContextWindow(sourceContent, candidate.quote, 2000);

            const modelResult = await runModeler(
                llm,
                candidate,
                contextWindow,
                sourceId,
                vaultDir,
                logger!,
                currentCritique,
                existingContent
            );

            if (!modelResult) {
                await logger?.log(`[Model] Failed to model ${candidate.name}`, 'WARN');
                break;
            }

            // Write the note
            await fs.mkdir(join(vaultDir, subfolder), { recursive: true });
            await fs.writeFile(expectedPath, modelResult.output);

            // Verify
            const verification = await runVerifier(llm, expectedPath, vaultDir, logger!, sourceContent);

            if (verification.pass) {
                success = true;
                const action = existingContent ? 'Updated' : 'Created';
                await logger?.log(`[Model] ${action} note: ${expectedPath}`);
                notesCreated.push(expectedPath);
            } else {
                await logger?.log(`[Model] Attempt ${attempts} failed verification`, 'WARN');
                currentCritique = verification.issues.join('\n');

                // Log failure for self-learning analysis
                await logVerificationFailure(vaultDir, {
                    timestamp: new Date().toISOString(),
                    candidate_name: candidate.name,
                    candidate_type: candidate.type,
                    step: 'verification',
                    source_context: contextWindow.slice(0, 5000),  // Limit size
                    generated_content: modelResult.output.slice(0, 5000),
                    issues: verification.issues,
                    prompt_used: 'prompt-model-artifact.md',
                });

                if (attempts === maxRetries) {
                    await logger?.log(`[Model] Max retries reached for ${candidate.name}. Keeping imperfect note.`, 'WARN');
                    notesCreated.push(expectedPath);
                }
            }
        }
    }

    await logger?.log(`[Model] Created ${notesCreated.length} notes`);

    return {
        success: true,
        outputs: {
            notes_created: notesCreated.length,
            notes: notesCreated
        }
    };
});

/**
 * Verify step - verify all notes in vault
 */
registerStepExecutor('verify', async (step, inputs, vaultDir, llm, logger) => {
    const notes = inputs.notes as string[] || [];
    const sourceContent = inputs.sourceContent as string;

    if (notes.length === 0) {
        await logger?.log(`[Verify] No notes to verify`);
        return { success: true, outputs: { verified: 0, pass_rate: 1.0 } };
    }

    let passed = 0;
    let failed = 0;

    await logger?.log(`[Verify] Verifying ${notes.length} notes`);

    for (const notePath of notes) {
        const result = await runVerifier(llm, notePath, vaultDir, logger!, sourceContent);
        if (result.pass) {
            passed++;
        } else {
            failed++;
            await logger?.log(`[Verify] Failed: ${notePath}`, 'WARN');
        }
    }

    const pass_rate = notes.length > 0 ? passed / notes.length : 1.0;
    await logger?.log(`[Verify] Pass rate: ${(pass_rate * 100).toFixed(1)}% (${passed}/${notes.length})`);

    return {
        success: true,
        outputs: {
            verified: passed,
            failed,
            pass_rate
        }
    };
});

/**
 * Link step - resolve wikilinks and create stubs
 */
registerStepExecutor('link', async (step, inputs, vaultDir, llm, logger) => {
    try {
        await logger?.log(`[Link] Resolving links in vault`);

        // First, run Zettelkasten link resolution (Phase 2)
        const linkResult = await resolveLinksInVault(vaultDir, logger);

        // Then run legacy linker for stub creation
        const stubsCreated = await runLinker(llm, vaultDir, logger!);

        await logger?.log(`[Link] Created ${stubsCreated} stubs`);

        return {
            success: true,
            outputs: {
                stubs_created: stubsCreated,
                links_resolved: linkResult?.totalResolved || 0
            }
        };
    } catch (error: any) {
        await logger?.log(`[Link] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Index step - index vault contents and build graph
 */
registerStepExecutor('index', async (step, inputs, vaultDir, llm, logger) => {
    try {
        await logger?.log(`[Index] Building vault index`);
        await runIndexer(vaultDir, logger!);

        // Read back stats
        const indexPath = join(vaultDir, '_index', 'notes.json');
        let noteCount = 0;
        try {
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            const notes = JSON.parse(indexContent);
            noteCount = notes.length;
        } catch {
            // Index may not exist yet
        }

        await logger?.log(`[Index] Indexed ${noteCount} notes`);

        return {
            success: true,
            outputs: {
                indexed: noteCount
            }
        };
    } catch (error: any) {
        await logger?.log(`[Index] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Story step - generate stories from concepts
 */
registerStepExecutor('story', async (step, inputs, vaultDir, llm, logger) => {
    try {
        // Find first concept to generate story for
        const conceptsDir = join(vaultDir, 'concepts');
        let conceptFiles: string[] = [];

        try {
            conceptFiles = (await fs.readdir(conceptsDir)).filter(f => f.endsWith('.md'));
        } catch {
            // No concepts yet
        }

        if (conceptFiles.length === 0) {
            await logger?.log(`[Story] No concepts found for story generation`);
            return { success: true, outputs: { story_created: false } };
        }

        // Use first concept
        const firstConcept = conceptFiles[0].replace('.md', '');
        await logger?.log(`[Story] Generating story for: ${firstConcept}`);

        const storyPath = await runStoryteller(llm, firstConcept, vaultDir, logger!, firstConcept);

        return {
            success: true,
            outputs: {
                story_created: !!storyPath,
                story_path: storyPath
            }
        };
    } catch (error: any) {
        await logger?.log(`[Story] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract a context window around a quote from the source text.
 * Returns ±windowSize characters around the first occurrence of the quote.
 */
function extractContextWindow(sourceText: string, quote: string, windowSize: number = 2000): string {
    if (!sourceText || !quote) return sourceText?.slice(0, windowSize * 2) || '';

    const idx = sourceText.indexOf(quote);
    if (idx === -1) {
        // Quote not found exactly, return larger chunk from start
        return sourceText.slice(0, windowSize * 2);
    }
    const start = Math.max(0, idx - windowSize);
    const end = Math.min(sourceText.length, idx + quote.length + windowSize);
    return sourceText.slice(start, end);
}

// Export to make this module importable for side effects
export { };
