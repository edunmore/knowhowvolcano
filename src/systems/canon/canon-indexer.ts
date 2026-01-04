/**
 * CanonIndexer - Regenerate the canon index from method files
 */

import { writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { CanonIndex, CanonIndexEntry } from './types.js';

/**
 * Parse a canon entry file and extract index information
 */
function parseCanonEntry(filePath: string): CanonIndexEntry | null {
    try {
        const content = readFileSync(filePath, 'utf-8');

        // Parse frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return null;

        const frontmatter = frontmatterMatch[1];

        const parseValue = (field: string): string => {
            const match = frontmatter.match(new RegExp(`${field}:\\s*"?([^"\\n]*)"?`));
            return match ? match[1].trim() : '';
        };

        const parseArray = (field: string): string[] => {
            const match = frontmatter.match(new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`));
            if (!match) return [];
            return match[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
        };

        const methodId = parseValue('method_id');
        if (!methodId) return null;

        // Extract kernel fingerprint from content
        const steps: string[] = [];
        const processMatch = content.match(/## Process\s*\n([\s\S]*?)(?=\n## |$)/i);
        if (processMatch) {
            const lines = processMatch[1].split('\n');
            for (const line of lines) {
                if (line.match(/^\d+\.|^- /)) {
                    steps.push(line.replace(/^\d+\.\s*|- /, '').slice(0, 50));
                }
            }
        }

        // Extract purpose as mechanism
        const purposeMatch = content.match(/## Purpose\s*\n\n?(.+)/i);
        const mechanism = purposeMatch ? purposeMatch[1].slice(0, 100) : '';

        return {
            method_id: methodId,
            title: parseValue('title'),
            aliases: parseArray('aliases'),
            domain_tags: parseArray('domain_tags'),
            kernel_fingerprint: {
                steps: steps.slice(0, 5),
                mechanism,
                primary_outcome: '',
            },
            signals: {
                canonical_questions: [],
                decision_rules: [],
            },
            source_span_hint: {
                typical_sources: [],
                adjacent_dependency: '',
            },
            file: `./canon/methods/${basename(filePath)}`,
        };
    } catch {
        return null;
    }
}

/**
 * Regenerate the canon index from all method files
 */
export function regenerateIndex(canonDir: string, outputPath: string): CanonIndex {
    const methodsDir = join(canonDir, 'methods');
    const entries: CanonIndexEntry[] = [];

    if (existsSync(methodsDir)) {
        const files = readdirSync(methodsDir)
            .filter(f => f.endsWith('.md'))
            .sort();

        for (const file of files) {
            const entry = parseCanonEntry(join(methodsDir, file));
            if (entry) {
                entries.push(entry);
            }
        }
    }

    const index: CanonIndex = {
        version: 1,
        updated: new Date().toISOString().split('T')[0],
        entries,
    };

    // Generate markdown content
    const content = generateIndexMarkdown(index);
    writeFileSync(outputPath, content, 'utf-8');

    return index;
}

/**
 * Generate markdown content for the index
 */
function generateIndexMarkdown(index: CanonIndex): string {
    let content = `# Methods Canon Index
version: ${index.version}
updated: ${index.updated}
notes: "Compact index only. Full entries live in ./canon/methods/"

---

`;

    for (const entry of index.entries) {
        content += `## ${entry.method_id}
\`\`\`yaml
method_id: ${entry.method_id}
title: "${entry.title}"
aliases: [${entry.aliases.map(a => `"${a}"`).join(', ')}]
domain_tags: [${entry.domain_tags.map(t => `"${t}"`).join(', ')}]
kernel_fingerprint:
  steps: [${entry.kernel_fingerprint.steps.map(s => `"${s}"`).join(', ')}]
  mechanism: "${entry.kernel_fingerprint.mechanism}"
  primary_outcome: "${entry.kernel_fingerprint.primary_outcome}"
signals:
  canonical_questions: []
  decision_rules: []
source_span_hint:
  typical_sources: []
  adjacent_dependency: ""
file: "${entry.file}"
\`\`\`

`;
    }

    return content;
}
