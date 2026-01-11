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
import { assembleFilteredCorpus } from './utils/corpus-assembler.js';
import { checkDuplicate, type DuplicateRecord } from './utils/embedding-dedup.js';

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

    // Phase 1 improvement: Fast mode for small sources
    // Skip gating if total content is < 10kb
    const totalSize = loadedChunks.reduce((sum, c) => sum + c.content.length, 0);
    const fastMode = totalSize < 10000;

    if (fastMode) {
        await logger?.log(`[Gate] Fast mode: source < 10kb (${(totalSize / 1024).toFixed(1)}kb), all chunks FULL_MODEL`);
        for (const chunk of loadedChunks) {
            chunk.metadata.decision = 'FULL_MODEL';
            await writeSourceChunk(chunk);
        }
        return {
            success: true,
            outputs: {
                sourceId,
                gated_chunks: loadedChunks.length,
                full_model: loadedChunks.length,
                light_scan: 0,
                skip: 0,
                fast_mode: true,
            }
        };
    }

    await logger?.log(`[Gate] Loaded ${loadedChunks.length} chunks (${(totalSize / 1024).toFixed(1)}kb), running Azure GPT-5-nano gate...`);

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
 * Assemble Corpus step (vNext M1) - build filtered corpora from gated chunks
 * Creates FULL_MODEL_TEXT and LIGHT_SCAN_TEXT for downstream processing
 */
registerStepExecutor('assemble_corpus', async (step, inputs, vaultDir, llm, logger) => {
    const sourceId = inputs.sourceId as string;

    if (!sourceId) {
        return {
            success: false,
            outputs: { error: 'No sourceId provided for corpus assembly' }
        };
    }

    // Generate run ID for this execution
    const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    try {
        await logger?.log(`[AssembleCorpus] Building filtered corpus from source: ${sourceId}`);

        const corpus = await assembleFilteredCorpus(vaultDir, sourceId, runId);

        await logger?.log(
            `[AssembleCorpus] Stats: ${corpus.stats.fullModelChunks} FULL_MODEL, ` +
            `${corpus.stats.lightScanChunks} LIGHT_SCAN, ${corpus.stats.skipChunks} SKIP`
        );
        await logger?.log(
            `[AssembleCorpus] Corpus sizes: FULL_MODEL=${corpus.stats.fullModelChars} chars, ` +
            `LIGHT_SCAN=${corpus.stats.lightScanChars} chars`
        );

        return {
            success: true,
            outputs: {
                runId,
                fullModelText: corpus.fullModelText,
                lightScanText: corpus.lightScanText,
                fullModelChunkIds: corpus.fullModelChunkIds,
                lightScanChunkIds: corpus.lightScanChunkIds,
                corpusStats: corpus.stats,
            }
        };
    } catch (error: any) {
        await logger?.log(`[AssembleCorpus] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
});

/**
 * Extract Filtered step (vNext M1) - extract candidates from FILTERED corpus
 * Uses fullModelText from assemble_corpus instead of full source
 */
registerStepExecutor('extract_filtered', async (step, inputs, vaultDir, llm, logger) => {
    // Use filtered corpus instead of full source
    const fullModelText = inputs.fullModelText as string;
    const file = inputs.file as string;
    const sourceId = inputs.sourceId as string;

    if (!fullModelText) {
        return { success: false, outputs: { error: 'No filtered corpus (fullModelText) for extraction' } };
    }

    try {
        await logger?.log(`[ExtractFiltered] Running extractor on filtered corpus (${fullModelText.length} chars)`);
        const candidates = await runExtractor(llm, fullModelText, file || 'source', vaultDir, logger!);

        await logger?.log(`[ExtractFiltered] Extracted ${candidates.length} candidates from filtered corpus`);

        return {
            success: true,
            outputs: {
                candidates,
                candidateCount: candidates.length,
                // Pass fullModelText as sourceContent for downstream modeling
                sourceContent: fullModelText
            }
        };
    } catch (error: any) {
        await logger?.log(`[ExtractFiltered] Error: ${error.message}`, 'ERROR');
        return { success: false, outputs: { error: error.message } };
    }
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

                // M4: Add verified: true to frontmatter to skip re-verification
                let noteContent = await fs.readFile(expectedPath, 'utf-8');
                if (noteContent.startsWith('---')) {
                    // Insert verified: true after the first ---
                    noteContent = noteContent.replace(/^---\n/, `---\nverified: true\nverified_at: ${new Date().toISOString()}\n`);
                    await fs.writeFile(expectedPath, noteContent);
                }

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
 * Model Bundle step (vNext M3) - chunk-centric modeling with sliding windows
 * For each FULL_MODEL chunk, models with context from prev/next chunks.
 * Caps at K grounded notes per chunk (default 3).
 */
registerStepExecutor('model_bundle', async (step, inputs, vaultDir, llm, logger) => {
    const { assembleWindows, formatWindowForModeler, WINDOW_MODELER_INSTRUCTION } = await import('./utils/window-assembler.js');
    const { loadSourceChunks } = await import('./utils/chunk-loader.js');

    // Get sourceId from inputs or find most recent
    let sourceId = inputs.sourceId as string;
    if (!sourceId) {
        const sourcesDir = join(vaultDir, '_sources');
        const sources = await fs.readdir(sourcesDir);
        sourceId = sources.filter(s => s.startsWith('src_')).sort().reverse()[0];
    }

    const maxNotesPerChunk = (step.inputs?.max_notes_per_chunk as number) || 5;

    if (!sourceId) {
        await logger?.log(`[ModelBundle] No sourceId found`);
        return { success: false, outputs: { error: 'No sourceId' } };
    }

    await logger?.log(`[ModelBundle] Loading chunks for ${sourceId}`);

    // Load all chunks
    const chunks = await loadSourceChunks(vaultDir, sourceId);
    if (chunks.length === 0) {
        await logger?.log(`[ModelBundle] No chunks found`);
        return { success: true, outputs: { notes_created: 0, notes: [], windows_processed: 0 } };
    }

    // Assemble sliding windows for FULL_MODEL chunks
    const windows = assembleWindows(chunks, ['FULL_MODEL']);
    await logger?.log(`[ModelBundle] Created ${windows.length} windows from ${chunks.length} chunks`);

    // Initialize vector store for embedding-based deduplication
    const { VectorStore } = await import('./utils/vector-store.js');
    const indexDir = join(vaultDir, '_index');
    await fs.mkdir(indexDir, { recursive: true });
    const vectorStore = new VectorStore(vaultDir);

    // Index existing notes for dedup
    if (vectorStore.count === 0) {
        await logger?.log(`[ModelBundle] Building vector index...`);
        await vectorStore.indexVault(logger);
    }
    await logger?.log(`[ModelBundle] Vector store: ${vectorStore.count} indexed notes`);

    // Configurable dedup threshold (can be set in step inputs)
    const dedupThreshold = (step.inputs?.dedup_threshold as number) || 0.7;
    const verifyAmbiguous = (step.inputs?.verify_ambiguous as boolean) ?? true;

    const allNotes: string[] = [];
    let skippedDueDeDup = 0;
    let mergedDueDeDup = 0;

    // Track duplicates for later link creation
    const duplicatesFound: DuplicateRecord[] = [];
    // Track related notes for potential linking
    const relatedNotes: Array<{ candidateName: string; relatedNoteId: string; relatedTitle: string }> = [];

    for (let i = 0; i < windows.length; i++) {
        const windowCtx = windows[i];
        const windowText = windowCtx.formattedText;

        await logger?.log(`[ModelBundle] Processing window ${i + 1}/${windows.length} (chunk: ${windowCtx.window.current.chunkId})`);

        // Build context with window instruction
        const fullContext = `${WINDOW_MODELER_INSTRUCTION}\n\n${windowText}`;

        // For now, we use the existing extract->model flow but with windowed context
        // Future: create dedicated bundle-modeler prompt that outputs K notes directly
        const candidates = await runExtractor(llm, fullContext, `window-${i}`, vaultDir, logger!);

        // Cap at max notes per chunk
        const cappedCandidates = candidates.slice(0, maxNotesPerChunk);
        if (candidates.length > maxNotesPerChunk) {
            await logger?.log(`[ModelBundle] Capped from ${candidates.length} to ${maxNotesPerChunk} candidates`, 'DEBUG');
        }

        for (const candidate of cappedCandidates) {
            const subfolder = `${candidate.type}s`;
            const filename = getArtifactFilename(candidate.name, candidate.type);
            const notePath = join(vaultDir, subfolder, filename);

            try {
                // Check if note already exists (by filename)
                await fs.access(notePath);
                await logger?.log(`[ModelBundle] Skipping ${candidate.name} - already exists`, 'DEBUG');
                allNotes.push(notePath);
                continue;
            } catch {
                // Note doesn't exist by filename, check embeddings
            }

            // Check for semantic duplicates using improved dedup
            const dedupResult = await checkDuplicate(candidate, vectorStore, logger!, {
                threshold: dedupThreshold,
                verifyAmbiguous
            });

            if (dedupResult.action === 'SKIP' && dedupResult.matchedNote) {
                // Track this duplicate for later link creation
                duplicatesFound.push({
                    candidateName: candidate.name,
                    candidateType: candidate.type,
                    matchedNoteId: dedupResult.matchedNote.id,
                    matchedNoteTitle: dedupResult.matchedNote.title,
                    matchedFilePath: dedupResult.matchedNote.filePath,
                    similarity: dedupResult.matchedNote.similarity,
                    sourceChunk: windowCtx.window.current.chunkId
                });
                skippedDueDeDup++;
                continue;
            }

            if (dedupResult.action === 'MERGE' && dedupResult.matchedNote) {
                // TODO: Implement actual merge - append new context to existing note
                // For now, skip but log differently
                await logger?.log(`[ModelBundle] Would MERGE into ${dedupResult.matchedNote.title} (not yet implemented) - skipping`);
                duplicatesFound.push({
                    candidateName: candidate.name,
                    candidateType: candidate.type,
                    matchedNoteId: dedupResult.matchedNote.id,
                    matchedNoteTitle: dedupResult.matchedNote.title,
                    matchedFilePath: dedupResult.matchedNote.filePath,
                    similarity: dedupResult.matchedNote.similarity,
                    sourceChunk: windowCtx.window.current.chunkId
                });
                mergedDueDeDup++;
                continue;
            }

            if (dedupResult.action === 'LINK_RELATED' && dedupResult.matchedNote) {
                // Create note but track that it should be linked to related note
                relatedNotes.push({
                    candidateName: candidate.name,
                    relatedNoteId: dedupResult.matchedNote.id,
                    relatedTitle: dedupResult.matchedNote.title
                });
                // Continue to create the note
            }

            const modelResult = await runModeler(
                llm,
                candidate,
                windowText,  // Use window as context
                sourceId,
                vaultDir,
                logger!
            );

            if (modelResult) {
                await fs.mkdir(join(vaultDir, subfolder), { recursive: true });
                await fs.writeFile(notePath, modelResult.output);
                await logger?.log(`[ModelBundle] Created: ${notePath}`);
                allNotes.push(notePath);

                // Index newly created note for future dedup
                await vectorStore.indexNote(notePath);

                // Verify inline
                const verification = await runVerifier(llm, notePath, vaultDir, logger!, fullContext);
                if (verification.pass) {
                    // M4: Mark as verified to skip in verify step
                    let noteContent = await fs.readFile(notePath, 'utf-8');
                    if (!noteContent.includes('verified: true')) {
                        noteContent = noteContent.replace(
                            /^(---\n)/,
                            `---\nverified: true\nverified_at: ${new Date().toISOString()}\n`
                        );
                        await fs.writeFile(notePath, noteContent);
                        await logger?.log(`[ModelBundle] Verified: ${filename}`);
                    }
                } else {
                    await logger?.log(`[ModelBundle] Verification issues for ${filename}: ${verification.issues.join('; ')}`, 'WARN');
                }
            }
        }
    }

    // Log dedup summary
    if (duplicatesFound.length > 0) {
        await logger?.log(`[ModelBundle] Duplicate summary: ${skippedDueDeDup} skipped, ${mergedDueDeDup} merged`);
        await logger?.log(`[ModelBundle] Duplicates found: ${duplicatesFound.map(d => `"${d.candidateName}" → "${d.matchedNoteTitle}"`).join(', ')}`, 'DEBUG');
    }

    // Save duplicates for later use by link step
    if (duplicatesFound.length > 0) {
        const duplicatesPath = join(vaultDir, '_index', 'duplicates-found.json');
        await fs.writeFile(duplicatesPath, JSON.stringify(duplicatesFound, null, 2));
        await logger?.log(`[ModelBundle] Saved ${duplicatesFound.length} duplicate records for linking`);
    }

    await logger?.log(`[ModelBundle] Created ${allNotes.length} notes from ${windows.length} windows`);

    return {
        success: true,
        outputs: {
            notes_created: allNotes.length,
            notes: allNotes,
            windows_processed: windows.length,
            duplicates_skipped: skippedDueDeDup,
            duplicates_merged: mergedDueDeDup,
            related_notes: relatedNotes.length
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
    let skipped = 0;

    await logger?.log(`[Verify] Verifying ${notes.length} notes`);

    for (const notePath of notes) {
        // M4: Skip notes that were already verified during modeling
        try {
            const noteContent = await fs.readFile(notePath, 'utf-8');
            if (noteContent.includes('verified: true')) {
                skipped++;
                await logger?.log(`[Verify] Skipping ${notePath.split('/').pop()} (already verified)`, 'DEBUG');
                passed++; // Count as passed since it was verified earlier
                continue;
            }
        } catch {
            // File doesn't exist, skip
            continue;
        }

        const result = await runVerifier(llm, notePath, vaultDir, logger!, sourceContent);
        if (result.pass) {
            passed++;
        } else {
            failed++;
            await logger?.log(`[Verify] Failed: ${notePath}`, 'WARN');
        }
    }

    const pass_rate = notes.length > 0 ? passed / notes.length : 1.0;
    await logger?.log(`[Verify] Pass rate: ${(pass_rate * 100).toFixed(1)}% (${passed}/${notes.length}, ${skipped} skipped)`);

    return {
        success: true,
        outputs: {
            verified: passed,
            failed,
            skipped,
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
 * Emit Candidates step (vNext M2) - create candidate notes from LINK_INTENTS
 * This is deterministic - no LLM calls
 */
registerStepExecutor('emit_candidates', async (step, inputs, vaultDir, llm, logger) => {
    const { emitCandidates } = await import('./utils/candidate-emitter.js');
    const notes = inputs.notes as string[] || [];

    if (notes.length === 0) {
        await logger?.log(`[EmitCandidates] No notes to process`);
        return { success: true, outputs: { candidates_created: 0, candidates_skipped: 0 } };
    }

    await logger?.log(`[EmitCandidates] Processing ${notes.length} notes for LINK_INTENTS`);

    // Type for candidates
    interface LocalLinkCandidate {
        term: string;
        type_guess: 'concept' | 'procedure' | 'principle' | 'misconception' | 'unknown';
        reason: string;
        source_note?: string;
    }

    const allCandidates: LocalLinkCandidate[] = [];

    // Extract LINK_INTENTS from each note
    for (const notePath of notes) {
        try {
            const content = await fs.readFile(notePath, 'utf-8');

            // Find the LINK_INTENTS section using string search (regex failed on backticks)
            const sectionIdx = content.indexOf('## LINK_INTENTS');
            if (sectionIdx === -1) continue;

            // Extract the rest of the content from the section
            const rest = content.slice(sectionIdx);

            // Find JSON block boundaries
            const jsonStart = rest.indexOf('{');
            const jsonEnd = rest.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) continue;

            try {
                const jsonStr = rest.slice(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(jsonStr);
                const linkIntents = parsed.link_intents || [];

                await logger?.log(`[EmitCandidates] Found ${linkIntents.length} link intents in ${notePath.split('/').pop()}`, 'DEBUG');

                for (const intent of linkIntents) {
                    // Only create candidates for terms that should have stubs
                    if (intent.stub_policy === 'create_with_ai_explanation' || intent.stub_policy === 'create_empty') {
                        allCandidates.push({
                            term: intent.target_title,
                            type_guess: intent.intent_type === 'concept' ? 'concept' :
                                intent.intent_type === 'procedure' ? 'procedure' :
                                    intent.intent_type === 'tool' ? 'procedure' : 'concept',
                            reason: intent.reason || `Referenced in ${notePath.split('/').pop()}`,
                            source_note: notePath.split('/').pop()?.replace('.md', ''),
                        });
                    }
                }
            } catch (e) {
                await logger?.log(`[EmitCandidates] Failed to parse LINK_INTENTS JSON from ${notePath}: ${e}`, 'DEBUG');
            }
        } catch (e) {
            await logger?.log(`[EmitCandidates] Failed to read ${notePath}`, 'DEBUG');
        }
    }

    await logger?.log(`[EmitCandidates] Found ${allCandidates.length} link candidates`);

    if (allCandidates.length === 0) {
        return { success: true, outputs: { candidates_created: 0, candidates_skipped: 0 } };
    }

    const result = await emitCandidates(allCandidates, vaultDir, logger);

    return {
        success: true,
        outputs: {
            candidates_created: result.created,
            candidates_skipped: result.skipped,
            candidate_paths: result.paths,
        }
    };
});

/**
 * Emergent Artifacts step (vNext M5) - create strands, MOCs, bridges, trails
 */
registerStepExecutor('emergent_artifacts', async (step, inputs, vaultDir, llm, logger) => {
    const { generateEmergentArtifacts } = await import('./utils/emergent-artifacts.js');

    const sourceId = inputs.sourceId as string;
    const notes = inputs.notes as string[] || [];

    if (notes.length === 0) {
        await logger?.log(`[EmergentArtifacts] No notes to process`);
        return { success: true, outputs: { strands: 0, mocs: 0, bridges: 0, trails: 0 } };
    }

    await logger?.log(`[EmergentArtifacts] Generating emergent artifacts for ${notes.length} notes`);

    const results = await generateEmergentArtifacts(vaultDir, sourceId, notes, llm, logger);

    return {
        success: true,
        outputs: {
            strands: results.strands.length,
            mocs: results.mocs.length,
            bridges: results.bridges.length,
            trails: results.trails.length,
            paths: [...results.strands, ...results.mocs, ...results.bridges, ...results.trails]
        }
    };
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
