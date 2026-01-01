/**
 * CanonMatcher - Match extraction against existing canon entries
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { CanonIndex, CanonEntry, MatchResult, ExtractionDoc } from './types.js';
import { loadPromptWithValues } from './prompt-loader.js';

/**
 * Load the canon index from file
 */
export function loadCanonIndex(indexPath: string): CanonIndex | null {
    if (!existsSync(indexPath)) {
        return null;
    }

    const content = readFileSync(indexPath, 'utf-8');
    const entries: CanonIndex['entries'] = [];

    // Parse YAML blocks from markdown
    const yamlBlocks = content.matchAll(/```yaml\n([\s\S]*?)```/g);
    for (const match of yamlBlocks) {
        try {
            // Simple YAML parsing for our structure
            const yaml = match[1];
            const entry: any = {};

            const parseValue = (line: string): string => {
                const match = line.match(/:\s*"?([^"]*)"?$/);
                return match ? match[1] : '';
            };

            const parseArray = (line: string): string[] => {
                const match = line.match(/:\s*\[(.*)\]/);
                if (!match) return [];
                return match[1].split(',').map(s => s.trim().replace(/"/g, ''));
            };

            for (const line of yaml.split('\n')) {
                if (line.startsWith('method_id:')) entry.method_id = parseValue(line);
                if (line.startsWith('title:')) entry.title = parseValue(line);
                if (line.startsWith('aliases:')) entry.aliases = parseArray(line);
                if (line.startsWith('domain_tags:')) entry.domain_tags = parseArray(line);
                if (line.startsWith('file:')) entry.file = parseValue(line);
            }

            if (entry.method_id) {
                entries.push({
                    method_id: entry.method_id,
                    title: entry.title || '',
                    aliases: entry.aliases || [],
                    domain_tags: entry.domain_tags || [],
                    kernel_fingerprint: { steps: [], mechanism: '', primary_outcome: '' },
                    signals: { canonical_questions: [], decision_rules: [] },
                    source_span_hint: { typical_sources: [], adjacent_dependency: '' },
                    file: entry.file || '',
                });
            }
        } catch {
            // Skip malformed entries
        }
    }

    return {
        version: 1,
        updated: new Date().toISOString().split('T')[0],
        entries,
    };
}

/**
 * Load a full canon entry
 */
export function loadCanonEntry(entryPath: string): CanonEntry | null {
    if (!existsSync(entryPath)) {
        return null;
    }

    const content = readFileSync(entryPath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

    const parseValue = (field: string): string => {
        const match = frontmatter.match(new RegExp(`${field}:\\s*"?([^"\\n]*)"?`));
        return match ? match[1] : '';
    };

    return {
        method_id: parseValue('method_id'),
        title: parseValue('title'),
        aliases: [],
        domain_tags: [],
        created: parseValue('created'),
        last_updated: parseValue('last_updated'),
        content,
        filePath: entryPath,
    };
}

/**
 * Match extraction against canon index (index-first approach)
 */
export async function matchCanon(
    llm: LLMHandle,
    extraction: ExtractionDoc,
    canonIndex: CanonIndex | null,
    canonDir: string,
    maxCandidates: number = 3
): Promise<MatchResult> {
    // If no canon exists, it's a new method
    if (!canonIndex || canonIndex.entries.length === 0) {
        return {
            matched_method_id: null,
            confidence: 100,
            rationale: 'No existing canon entries to match against.',
        };
    }

    // Build matching prompt using external prompt file
    const candidateSummary = canonIndex.entries
        .slice(0, maxCandidates)
        .map(e => `- ${e.method_id}: ${e.title}`)
        .join('\n');

    const prompt = loadPromptWithValues('CANON_MATCHER', {
        extraction: extraction.rawMarkdown.slice(0, 2000) + '...',
        canonMethods: candidateSummary,
    });

    const results = await agent({ llm })
        .then({ prompt })
        .run();

    const output = results[0]?.llmOutput || '';

    // Parse result
    const matchId = output.match(/MATCH:\s*(\S+)/)?.[1];
    const confidence = parseInt(output.match(/CONFIDENCE:\s*(\d+)/)?.[1] || '0', 10);
    const rationale = output.match(/RATIONALE:\s*(.+)/)?.[1] || '';
    const mergeGuidance = output.match(/MERGE_GUIDANCE:\s*(.+)/)?.[1];

    return {
        matched_method_id: matchId === 'NONE' ? null : matchId || null,
        confidence,
        rationale,
        merge_guidance: mergeGuidance,
    };
}
