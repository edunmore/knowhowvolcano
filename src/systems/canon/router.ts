/**
 * ChapterRouter - Select bounded set of chapters for extraction
 * 
 * Uses chapter summaries for intelligent selection when available,
 * falls back to adjacent file selection otherwise.
 */

import { basename } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { RouterResult, CanonIndex } from './types.js';
import { buildChapterIndex, getAdjacentFiles, loadSourceFile } from './source-store.js';
import { loadChapterSummaries, formatSummariesForRouter, type ChapterSummaries } from './summarizer.js';
import { loadPrompt, loadPromptWithValues } from './prompt-loader.js';

/**
 * Parse the LLM's router output into structured result
 */
function parseRouterOutput(output: string, chapterIndex: string[]): Partial<RouterResult> {
    const selectedFiles: string[] = [];

    // Extract files from "# Selected Files" section
    const filesMatch = output.match(/# Selected Files[\s\S]*?(?=# |$)/i);
    if (filesMatch) {
        const lines = filesMatch[0].split('\n');
        for (const line of lines) {
            // Match file references like "- file1.md (START)" or "- 016_...md"
            const fileMatch = line.match(/[-*]\s*(\S+\.md)/i);
            if (fileMatch) {
                const fileName = fileMatch[1];
                // Find matching file in chapter index
                const match = chapterIndex.find(f =>
                    basename(f) === fileName || f.includes(fileName)
                );
                if (match && !selectedFiles.includes(match)) {
                    selectedFiles.push(match);
                }
            }
        }
    }

    // Determine mode based on output
    const mode = output.toLowerCase().includes('delta') ? 'DELTA' : 'DISCOVER';

    return {
        mode,
        selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        topCandidates: [],
    };
}

/**
 * Route to select chapters for extraction
 * Uses chapter summaries if available for intelligent selection
 */
export async function routeChapters(
    llm: LLMHandle,
    sourceDir: string,
    startFile: string,
    canonIndex: CanonIndex | null,
    maxFiles: number = 4,
    chapterSummaries?: ChapterSummaries | null
): Promise<RouterResult> {
    // Build chapter index
    const chapterIndex = buildChapterIndex(sourceDir);

    // Get the start file content for context
    const startDoc = loadSourceFile(startFile);
    const startFileName = basename(startFile);

    // Try to load chapter summaries if not provided
    const summaries = chapterSummaries ?? loadChapterSummaries(sourceDir);

    // Determine if we can use smart routing
    const hasSmartSummaries = summaries && summaries.entries.size > 0;

    // Build canon summary
    const canonSummary = canonIndex && canonIndex.entries.length > 0
        ? canonIndex.entries.map(e => `- ${e.method_id}: ${e.title}`).join('\n')
        : 'No existing methods in canon.';

    let prompt: string;

    if (hasSmartSummaries) {
        // Use smart routing with summaries - load from external file
        const summaryText = formatSummariesForRouter(summaries!);
        prompt = loadPromptWithValues('SMART_ROUTER', {
            startFile: startFileName,
            startPreview: startDoc.content.slice(0, 800),
            summaries: summaryText,
            canonSummary,
            maxFiles: String(maxFiles),
            additionalFiles: String(maxFiles - 1),
        });
    } else {
        // Fall back to original prompt - load from external file with placeholders
        const chapterList = chapterIndex.map((f, i) => `${i + 1}. ${basename(f)}`).join('\n');
        prompt = loadPromptWithValues('CHAPTER_ROUTER', {
            chapterIndex: chapterList,
            startFile: startFileName,
            canonSummary,
            maxFiles: String(maxFiles),
            startPreview: startDoc.content.slice(0, 1000),
        });
    }

    // Run LLM
    const results = await agent({ llm })
        .then({ prompt })
        .run();

    const output = results[0]?.llmOutput || '';

    // Parse output
    const parsed = parseRouterOutput(output, chapterIndex);

    // Fallback: if parsing failed, use simple adjacent file selection
    const selectedFiles = parsed.selectedFiles && parsed.selectedFiles.length > 0
        ? parsed.selectedFiles
        : getAdjacentFiles(chapterIndex, startFile, maxFiles);

    return {
        mode: parsed.mode || 'DISCOVER',
        selectedFiles,
        kernelSketch: {
            topic: basename(startFile).replace(/^\d+_/, '').replace(/_/g, ' ').replace('.md', ''),
            keyTerms: [],
        },
        topCandidates: parsed.topCandidates || [],
    };
}
