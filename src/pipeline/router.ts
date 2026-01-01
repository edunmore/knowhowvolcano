/**
 * ChapterRouter - Select bounded set of chapters for extraction
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { RouterResult, CanonIndex } from './types.js';
import { buildChapterIndex, getAdjacentFiles, loadSourceFile } from './source-store.js';

const ROUTER_PROMPT = readFileSync(
    new URL('../../PROMPTS/00_CHAPTER_ROUTER.md', import.meta.url),
    'utf-8'
);

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
 */
export async function routeChapters(
    llm: LLMHandle,
    sourceDir: string,
    startFile: string,
    canonIndex: CanonIndex | null,
    maxFiles: number = 4
): Promise<RouterResult> {
    // Build chapter index
    const chapterIndex = buildChapterIndex(sourceDir);

    // Get the start file content for context
    const startDoc = loadSourceFile(startFile);

    // Build prompt
    const chapterList = chapterIndex.map((f, i) => `${i + 1}. ${basename(f)}`).join('\n');

    const canonSummary = canonIndex && canonIndex.entries.length > 0
        ? canonIndex.entries.map(e => `- ${e.method_id}: ${e.title}`).join('\n')
        : 'No existing methods in canon.';

    const prompt = `${ROUTER_PROMPT}

CHAPTER INDEX:
${chapterList}

START FILE: ${basename(startFile)}

CANON INDEX SUMMARY:
${canonSummary}

MAX_FILES: ${maxFiles}

START FILE PREVIEW (first 1000 chars):
${startDoc.content.slice(0, 1000)}

Please select the files needed and output in the required format.`;

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
