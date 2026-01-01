/**
 * CanonUpdater - Create new or update existing canon entries
 * 
 * Canon entries are stored within the source material folder:
 *   {sourceDir}/canon/methods/MTH-YYYY-NNNN.md
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import type { ExtractionDoc, MatchResult, CanonEntry } from './types.js';

/**
 * Source file reference for provenance
 */
export interface SourceReference {
    startFile: string;
    selectedFiles: string[];
}

/**
 * Generate a new method ID with timestamp
 */
function generateMethodId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 99)).padStart(2, '0');
    return `MTH-${year}${month}${day}-${hour}${min}${seq}`;
}

/**
 * Get full ISO timestamp
 */
function getTimestamp(): string {
    return new Date().toISOString().replace('Z', '');
}

/**
 * Generate a title from extraction content
 */
function extractTitle(extraction: ExtractionDoc, startFile?: string): string {
    // Try multiple patterns to extract a meaningful title

    // Pattern 1: Look for Purpose section
    const purposeMatch = extraction.rawMarkdown.match(/## Purpose\s*\n+([^\n#]+)/i);
    if (purposeMatch) {
        const sentence = purposeMatch[1].split('.')[0].replace(/\[.*?\]/g, '').trim();
        if (sentence && sentence.length > 10 && sentence.length < 80) {
            return sentence;
        }
    }

    // Pattern 2: Look for first heading after Method Kernel
    const headingMatch = extraction.rawMarkdown.match(/# Method Kernel\s*\n+(?:.*?\n)*?## ([^\n]+)/i);
    if (headingMatch) {
        const heading = headingMatch[1].trim();
        if (heading !== 'Purpose' && heading.length < 80) {
            return heading;
        }
    }

    // Pattern 3: Use start file name as fallback
    if (startFile) {
        const name = basename(startFile, '.md')
            .replace(/^\d+_/, '')  // Remove leading numbers
            .replace(/_with_descriptions?$/, '')  // Remove suffix
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());  // Title case
        if (name) return name;
    }

    // Pattern 4: Look for any descriptive text
    const anyText = extraction.rawMarkdown.match(/(?:guide|model|method|technique|approach|framework)\s+(?:for\s+)?([^.\n]+)/i);
    if (anyText) {
        return anyText[0].slice(0, 60);
    }

    return 'Method Extraction';
}

/**
 * Create a new canon entry file
 */
export function createCanonEntry(
    extraction: ExtractionDoc,
    canonDir: string,
    provider?: string,
    sources?: SourceReference
): string {
    const methodId = generateMethodId();
    const timestamp = getTimestamp();
    const title = extractTitle(extraction, sources?.startFile);

    // Format source references
    const sourceList = sources?.selectedFiles
        ?.map(f => `  - ${basename(f)}`)
        .join('\n') || '  - unknown';

    const startFileName = sources?.startFile ? basename(sources.startFile) : 'unknown';

    const frontmatter = `---
method_id: ${methodId}
title: "${title}"
aliases: []
domain_tags: []
created: ${timestamp}
last_updated: ${timestamp}
provider: "${provider || 'unknown'}"
start_file: "${startFileName}"
---`;

    const content = `${frontmatter}

${extraction.rawMarkdown}

# Provenance

## Source Material
- **Start file:** ${startFileName}
- **Selected chapters:**
${sourceList}

## Extraction Details
- **Extracted:** ${timestamp}
- **Provider:** ${provider || 'unknown'}

## Confidence
75

# Changelog
- date: ${timestamp}
  change: "created"
  rationale: "Initial extraction from source material"
`;

    // Ensure directory exists (canon/methods/ within source dir)
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
    mergeGuidance: string,
    provider?: string,
    sources?: SourceReference
): string {
    const timestamp = getTimestamp();

    // Read existing content
    const existingContent = readFileSync(existingEntry.filePath, 'utf-8');

    // Update frontmatter
    const updatedContent = existingContent
        .replace(/last_updated: [\d\-T:.]+/, `last_updated: ${timestamp}`);

    // Add changelog entry with source info
    const sourceInfo = sources?.startFile ? ` from ${basename(sources.startFile)}` : '';
    const changelogEntry = `
- date: ${timestamp}
  change: "updated"
  provider: "${provider || 'unknown'}"
  rationale: "${mergeGuidance || 'Updated with new extraction'}${sourceInfo}"`;

    // Insert after # Changelog
    const finalContent = updatedContent.includes('# Changelog')
        ? updatedContent.replace(/# Changelog\n/, `# Changelog\n${changelogEntry}`)
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
    existingEntry?: CanonEntry,
    provider?: string,
    sources?: SourceReference
): { action: 'new' | 'update'; entryPath: string } {
    if (matchResult.matched_method_id && existingEntry) {
        // Update existing entry
        const entryPath = updateCanonEntry(
            extraction,
            existingEntry,
            matchResult.merge_guidance || '',
            provider,
            sources
        );
        return { action: 'update', entryPath };
    } else {
        // Create new entry
        const entryPath = createCanonEntry(extraction, canonDir, provider, sources);
        return { action: 'new', entryPath };
    }
}

/**
 * Get the canon directory for a given source directory
 * Canon is stored within the source material folder
 */
export function getCanonDir(sourceDir: string): string {
    return join(sourceDir, 'canon');
}
