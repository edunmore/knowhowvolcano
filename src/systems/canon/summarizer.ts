/**
 * Chapter Summarizer - Generate knowledge-extraction-oriented summaries
 * 
 * Creates {sourceDir}/canon/chaptersummary.md with summaries focused on:
 * - Methods and techniques taught
 * - Key concepts and frameworks
 * - Decision patterns and rules
 * - Related topics and connections
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { listSourceFiles, loadSourceFile } from './source-store.js';
import { loadPromptWithValues } from './prompt-loader.js';

/**
 * Summary entry for a chapter
 */
export interface ChapterSummary {
    filename: string;
    methods: string[];
    concepts: string[];
    patterns: string[];
    related: string[];
    rawSummary: string;
}

/**
 * Loaded chapter summaries
 */
export interface ChapterSummaries {
    sourceDir: string;
    lastUpdated: string;
    entries: Map<string, ChapterSummary>;
}

/**
 * Parse a summary response into structured format
 */
function parseSummaryResponse(filename: string, response: string): ChapterSummary {
    const extractList = (label: string): string[] => {
        const match = response.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n*]+)`, 'i'));
        if (!match) return [];
        return match[1]
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 100);
    };

    return {
        filename,
        methods: extractList('Methods'),
        concepts: extractList('Concepts'),
        patterns: extractList('Patterns'),
        related: extractList('Related'),
        rawSummary: response,
    };
}

/**
 * Generate summary for a single chapter
 * Note: The LLM reads the file directly using its file-reading capability
 */
async function summarizeChapter(
    llm: LLMHandle,
    filePath: string
): Promise<ChapterSummary> {
    const filename = basename(filePath);
    const absolutePath = resolve(filePath);

    // Load prompt from external file - pass file path, not content
    const prompt = loadPromptWithValues('SUMMARIZER', {
        filename,
        content: `[Please read this file: ${absolutePath}]`,
    });

    const results = await agent({ llm })
        .then({ prompt })
        .run();

    const response = results[0]?.llmOutput || '';
    return parseSummaryResponse(filename, response);
}

/**
 * Get the path to the chapter summary file
 */
export function getSummaryFilePath(sourceDir: string): string {
    return join(sourceDir, 'canon', 'chaptersummary.md');
}

/**
 * Load existing chapter summaries
 */
export function loadChapterSummaries(sourceDir: string): ChapterSummaries | null {
    const summaryPath = getSummaryFilePath(sourceDir);

    if (!existsSync(summaryPath)) {
        return null;
    }

    const content = readFileSync(summaryPath, 'utf-8');
    const entries = new Map<string, ChapterSummary>();

    // Parse markdown format
    const sections = content.split(/\n## /);
    for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.split('\n');
        const filename = lines[0]?.trim();
        if (!filename || !filename.endsWith('.md')) continue;

        const summary = parseSummaryResponse(filename, section);
        entries.set(filename, summary);
    }

    // Extract last updated from header
    const lastUpdatedMatch = content.match(/Last updated: ([^\n]+)/);

    return {
        sourceDir,
        lastUpdated: lastUpdatedMatch?.[1] || 'unknown',
        entries,
    };
}

/**
 * Save chapter summaries to file
 */
function saveChapterSummaries(sourceDir: string, entries: Map<string, ChapterSummary>): void {
    const canonDir = join(sourceDir, 'canon');
    if (!existsSync(canonDir)) {
        mkdirSync(canonDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    let content = `# Chapter Summaries\n\nLast updated: ${timestamp}\n\nKnowledge-extraction-oriented summaries for routing decisions.\n\n---\n\n`;

    // Sort by filename
    const sortedEntries = [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    for (const [filename, summary] of sortedEntries) {
        content += `## ${filename}\n`;
        content += `**Methods:** ${summary.methods.join(', ') || 'None identified'}\n`;
        content += `**Concepts:** ${summary.concepts.join(', ') || 'None identified'}\n`;
        content += `**Patterns:** ${summary.patterns.join(', ') || 'None identified'}\n`;
        content += `**Related:** ${summary.related.join(', ') || 'None identified'}\n\n`;
    }

    writeFileSync(getSummaryFilePath(sourceDir), content, 'utf-8');
}

/**
 * Generate chapter summaries for all files in source directory
 * Incremental: only processes files not already in the summary
 */
export async function generateChapterSummaries(
    llm: LLMHandle,
    sourceDir: string,
    options: {
        force?: boolean;
        onProgress?: (current: number, total: number, filename: string) => void;
    } = {}
): Promise<ChapterSummaries> {
    // Load existing summaries
    const existing = options.force ? null : loadChapterSummaries(sourceDir);
    const entries = existing?.entries || new Map<string, ChapterSummary>();

    // Get all source files
    const sourceFiles = listSourceFiles(sourceDir);
    const filesToProcess: string[] = [];

    for (const filePath of sourceFiles) {
        const filename = basename(filePath);
        if (!entries.has(filename)) {
            filesToProcess.push(filePath);
        }
    }

    if (filesToProcess.length === 0) {
        console.log(`All ${entries.size} chapters already summarized.`);
        return { sourceDir, lastUpdated: existing?.lastUpdated || 'now', entries };
    }

    console.log(`Summarizing ${filesToProcess.length} chapters...`);

    // Process files one by one (incremental, resumable)
    for (let i = 0; i < filesToProcess.length; i++) {
        const filePath = filesToProcess[i];
        const filename = basename(filePath);

        options.onProgress?.(i + 1, filesToProcess.length, filename);
        console.log(`  [${i + 1}/${filesToProcess.length}] ${filename}`);

        try {
            const summary = await summarizeChapter(llm, filePath);
            entries.set(filename, summary);

            // Save incrementally after each file
            saveChapterSummaries(sourceDir, entries);
        } catch (error: any) {
            console.error(`    Error: ${error.message}`);
        }
    }

    const result: ChapterSummaries = {
        sourceDir,
        lastUpdated: new Date().toISOString(),
        entries,
    };

    console.log(`Summary complete: ${entries.size} chapters`);
    return result;
}

/**
 * Format summaries for router prompt
 */
export function formatSummariesForRouter(summaries: ChapterSummaries): string {
    if (summaries.entries.size === 0) {
        return 'No chapter summaries available.';
    }

    let output = '';
    const sortedEntries = [...summaries.entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    for (const [filename, summary] of sortedEntries) {
        output += `${filename}: Methods=[${summary.methods.join('; ')}] Concepts=[${summary.concepts.join('; ')}]\n`;
    }

    return output;
}
