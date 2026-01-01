/**
 * SourceStore - Load and index markdown source files
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import type { SourceDocument, ParagraphLocation } from './types.js';

/**
 * Parse a markdown file and extract paragraph locations
 */
function parseMarkdown(filePath: string, content: string): ParagraphLocation[] {
    const lines = content.split('\n');
    const paragraphs: ParagraphLocation[] = [];

    let currentHeading = '';
    let paragraphIndex = 0;
    let inParagraph = false;
    let paragraphStart = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detect headings
        if (trimmedLine.startsWith('#')) {
            currentHeading = trimmedLine.replace(/^#+\s*/, '');
            paragraphIndex = 0;
            inParagraph = false;
            continue;
        }

        // Detect paragraph boundaries
        if (trimmedLine === '') {
            if (inParagraph) {
                paragraphs.push({
                    file: filePath,
                    heading: currentHeading,
                    paragraphIndex,
                    lineStart: paragraphStart + 1, // 1-indexed
                    lineEnd: i, // 1-indexed
                });
                paragraphIndex++;
                inParagraph = false;
            }
        } else {
            if (!inParagraph) {
                paragraphStart = i;
                inParagraph = true;
            }
        }
    }

    // Handle last paragraph
    if (inParagraph) {
        paragraphs.push({
            file: filePath,
            heading: currentHeading,
            paragraphIndex,
            lineStart: paragraphStart + 1,
            lineEnd: lines.length,
        });
    }

    return paragraphs;
}

/**
 * Load a single markdown file
 */
export function loadSourceFile(filePath: string): SourceDocument {
    const content = readFileSync(filePath, 'utf-8');
    const paragraphs = parseMarkdown(filePath, content);

    return {
        path: filePath,
        content,
        paragraphs,
    };
}

/**
 * List all markdown files in a directory (sorted)
 */
export function listSourceFiles(sourceDir: string): string[] {
    const files = readdirSync(sourceDir)
        .filter(f => extname(f).toLowerCase() === '.md')
        .sort()
        .map(f => join(sourceDir, f));

    return files;
}

/**
 * Load multiple source files
 */
export function loadSourceFiles(filePaths: string[]): SourceDocument[] {
    return filePaths.map(loadSourceFile);
}

/**
 * Build a chapter index from a source directory
 */
export function buildChapterIndex(sourceDir: string): string[] {
    return listSourceFiles(sourceDir);
}

/**
 * Get adjacent files (previous and next) relative to a start file
 */
export function getAdjacentFiles(
    chapterIndex: string[],
    startFile: string,
    maxFiles: number = 4
): string[] {
    const startIndex = chapterIndex.findIndex(f =>
        f === startFile || basename(f) === basename(startFile)
    );

    if (startIndex === -1) {
        throw new Error(`Start file not found in chapter index: ${startFile}`);
    }

    // Start with the start file
    const selected: string[] = [chapterIndex[startIndex]];

    // Expand outward (prefer forward, then backward)
    let forward = startIndex + 1;
    let backward = startIndex - 1;

    while (selected.length < maxFiles && (forward < chapterIndex.length || backward >= 0)) {
        // Add next file
        if (forward < chapterIndex.length && selected.length < maxFiles) {
            selected.push(chapterIndex[forward]);
            forward++;
        }

        // Add previous file
        if (backward >= 0 && selected.length < maxFiles) {
            selected.unshift(chapterIndex[backward]);
            backward--;
        }
    }

    return selected;
}

/**
 * Format source content for prompt injection
 */
export function formatSourcesForPrompt(sources: SourceDocument[]): string {
    return sources.map((doc, i) => {
        return `## FILE ${i + 1}: ${basename(doc.path)}\n\n${doc.content}`;
    }).join('\n\n---\n\n');
}
