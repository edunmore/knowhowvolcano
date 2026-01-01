/**
 * CanonUpdater - Create new or update existing canon entries
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { ExtractionDoc, MatchResult, CanonEntry } from './types.js';

/**
 * Generate a new method ID
 */
function generateMethodId(): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    return `MTH-${year}-${seq}`;
}

/**
 * Generate a title from extraction content
 */
function extractTitle(extraction: ExtractionDoc): string {
    // Try to find a title from the extraction
    const titleMatch = extraction.rawMarkdown.match(/# Method Kernel[\s\S]*?## Purpose\s*\n\n?(.+)/i);
    if (titleMatch) {
        // Use first sentence as title
        const sentence = titleMatch[1].split('.')[0];
        if (sentence && sentence.length < 100) {
            return sentence.replace(/\[.*?\]/g, '').trim();
        }
    }
    return 'Untitled Method';
}

/**
 * Create a new canon entry file
 */
export function createCanonEntry(
    extraction: ExtractionDoc,
    canonDir: string
): string {
    const methodId = generateMethodId();
    const today = new Date().toISOString().split('T')[0];
    const title = extractTitle(extraction);

    const frontmatter = `---
method_id: ${methodId}
title: "${title}"
aliases: []
domain_tags: []
created: ${today}
last_updated: ${today}
---`;

    const content = `${frontmatter}

${extraction.rawMarkdown}

# Provenance

## Sources
- Extracted on ${today}

## Confidence
75

# Changelog
- date: ${today}
  change: "created"
  rationale: "Initial extraction from source material"
`;

    // Ensure directory exists
    const methodsDir = join(canonDir, 'methods');
    if (!existsSync(methodsDir)) {
        mkdirSync(methodsDir, { recursive: true });
    }

    // Write file
    const filePath = join(methodsDir, `${methodId}.md`);
    writeFileSync(filePath, content, 'utf-8');

    return filePath;
}

/**
 * Update an existing canon entry with new information
 */
export function updateCanonEntry(
    extraction: ExtractionDoc,
    existingEntry: CanonEntry,
    mergeGuidance: string
): string {
    const today = new Date().toISOString().split('T')[0];

    // Read existing content
    const existingContent = readFileSync(existingEntry.filePath, 'utf-8');

    // Update frontmatter
    const updatedContent = existingContent.replace(
        /last_updated: [\d-]+/,
        `last_updated: ${today}`
    );

    // Add changelog entry
    const changelogEntry = `\n- date: ${today}
  change: "updated"
  rationale: "${mergeGuidance || 'Updated with new extraction'}"`;

    // Insert before last changelog entry or at end
    const finalContent = updatedContent.includes('# Changelog')
        ? updatedContent.replace(/# Changelog/, `# Changelog${changelogEntry}`)
        : updatedContent + `\n# Changelog${changelogEntry}`;

    writeFileSync(existingEntry.filePath, finalContent, 'utf-8');

    return existingEntry.filePath;
}

/**
 * Apply canon update based on match result
 */
export function applyCanonUpdate(
    extraction: ExtractionDoc,
    matchResult: MatchResult,
    canonDir: string,
    existingEntry?: CanonEntry
): { action: 'new' | 'update'; entryPath: string } {
    if (matchResult.matched_method_id && existingEntry) {
        // Update existing entry
        const entryPath = updateCanonEntry(
            extraction,
            existingEntry,
            matchResult.merge_guidance || ''
        );
        return { action: 'update', entryPath };
    } else {
        // Create new entry
        const entryPath = createCanonEntry(extraction, canonDir);
        return { action: 'new', entryPath };
    }
}
