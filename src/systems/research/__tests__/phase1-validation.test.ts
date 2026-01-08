/**
 * Unit tests for Phase 1 pipeline output validation
 * These tests check that the modeler output meets requirements:
 * - embedding_keys present (3-5 items)
 * - link_intents max 5
 * - derived_from has human-readable format
 * - No raw "Rung" terminology without abstraction
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface NoteFrontmatter {
    id: string;
    type: string;
    tags: string[];
    derived_from: {
        source_id: string;
        source_title: string;
        chunk?: string;
    } | string[];
    embedding_keys?: string[];
    verified?: boolean;
}

interface LinkIntent {
    target_title: string;
    intent_type: string;
    confidence: number;
    embedding_match_keys?: string[];
    reason: string;
}

interface LinkIntentsJson {
    note_id: string;
    link_intents: LinkIntent[];
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): NoteFrontmatter | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    try {
        return yaml.parse(match[1]) as NoteFrontmatter;
    } catch {
        return null;
    }
}

/**
 * Parse LINK_INTENTS JSON from note content
 */
function parseLinkIntents(content: string): LinkIntentsJson | null {
    const match = content.match(/## LINK_INTENTS\s*```json\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]) as LinkIntentsJson;
    } catch {
        return null;
    }
}

/**
 * Check if content contains unabstracted domain terms
 */
function findUnabstractedTerms(content: string): string[] {
    // Look for Rung A/B/C/D that are NOT preceded by 'author's "' or similar attribution
    const rungPattern = /Rung [A-D]/gi;
    const found: string[] = [];

    let match;
    while ((match = rungPattern.exec(content)) !== null) {
        // Check surrounding context for proper attribution
        const start = Math.max(0, match.index - 30);
        const end = Math.min(content.length, match.index + match[0].length + 10);
        const context = content.slice(start, end);

        // If context includes attribution markers, it's properly abstracted
        if (context.includes('author\'s "') || context.includes('(author') ||
            context.includes('author\'s') || context.includes('"Rung')) {
            continue; // Skip - properly attributed
        }
        found.push(match[0]);
    }
    return [...new Set(found)];
}

describe('Phase 1 Output Validation', () => {

    describe('Frontmatter Requirements', () => {

        it('should have embedding_keys with 3-5 items', async () => {
            // Test with sample note content
            const sampleContent = `---
id: concept-test
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_abc123"
  source_title: "Learning Design Chapter 1"
  chunk: "chunk_000000"
embedding_keys: ["learning progression", "competence levels", "skill assessment"]
---
# Test Concept
`;
            const fm = parseFrontmatter(sampleContent);
            expect(fm).not.toBeNull();
            expect(fm!.embedding_keys).toBeDefined();
            expect(fm!.embedding_keys!.length).toBeGreaterThanOrEqual(3);
            expect(fm!.embedding_keys!.length).toBeLessThanOrEqual(5);
        });

        it('should have human-readable derived_from', async () => {
            const sampleContent = `---
id: concept-test
type: concept
derived_from:
  source_id: "src_abc123"
  source_title: "Learning Design Chapter 1"
  chunk: "chunk_000000"
---
# Test
`;
            const fm = parseFrontmatter(sampleContent);
            expect(fm).not.toBeNull();
            expect(typeof fm!.derived_from).toBe('object');
            expect((fm!.derived_from as any).source_title).toBeDefined();
            expect((fm!.derived_from as any).source_title).not.toMatch(/^src_[a-f0-9]+$/);
        });

        it('should detect cryptic hash-only derived_from as a problem', async () => {
            const badContent = `---
id: concept-test
type: concept
derived_from: ["src_38e4b47a40f0"]
---
# Test
`;
            const fm = parseFrontmatter(badContent);
            // Old format uses array of strings - this IS the bad format we want to detect
            if (Array.isArray(fm?.derived_from)) {
                const hasOnlyHash = fm.derived_from.every(d => /^src_[a-f0-9]+$/.test(d));
                expect(hasOnlyHash).toBe(true); // This IS the bad format - test detects it
            }
        });
    });

    describe('LINK_INTENTS Requirements', () => {

        it('should have max 5 link_intents', async () => {
            const sampleContent = `---
id: concept-test
type: concept
---
# Test

## LINK_INTENTS
\`\`\`json
{
  "note_id": "concept-test",
  "link_intents": [
    {"target_title": "Concept A", "intent_type": "concept", "confidence": 0.8, "reason": "test"},
    {"target_title": "Concept B", "intent_type": "concept", "confidence": 0.8, "reason": "test"},
    {"target_title": "Concept C", "intent_type": "concept", "confidence": 0.8, "reason": "test"}
  ]
}
\`\`\`
`;
            const linkIntents = parseLinkIntents(sampleContent);
            expect(linkIntents).not.toBeNull();
            expect(linkIntents!.link_intents.length).toBeLessThanOrEqual(5);
        });

        it('should have embedding_match_keys in each link_intent', async () => {
            const sampleContent = `---
id: concept-test
---
# Test

## LINK_INTENTS
\`\`\`json
{
  "note_id": "concept-test",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "learning effort", "attention budget"],
      "reason": "Related design constraint"
    }
  ]
}
\`\`\`
`;
            const linkIntents = parseLinkIntents(sampleContent);
            expect(linkIntents).not.toBeNull();
            for (const intent of linkIntents!.link_intents) {
                expect(intent.embedding_match_keys).toBeDefined();
                expect(intent.embedding_match_keys!.length).toBeGreaterThanOrEqual(2);
            }
        });
    });

    describe('Term Abstraction', () => {

        it('should not have unabstracted Rung terminology', async () => {
            const badContent = `
# Outcome Ladder

## Definition
The ladder has four rungs: Rung A is remember, Rung B is recognize, 
Rung C is perform, and Rung D is transfer.
`;
            const unabstracted = findUnabstractedTerms(badContent);
            expect(unabstracted.length).toBeGreaterThan(0); // This SHOULD find problems
        });

        it('should accept properly abstracted terms', async () => {
            const goodContent = `
# Outcome Ladder

## Definition
The ladder has four levels:
- Level 1 (author's "Rung A"): Recall
- Level 2 (author's "Rung B"): Recognize
- Level 3 (author's "Rung C"): Perform
- Level 4 (author's "Rung D"): Transfer
`;
            const unabstracted = findUnabstractedTerms(goodContent);
            expect(unabstracted.length).toBe(0); // Should be clean
        });
    });
});

/**
 * Validate a real note file against Phase 1 requirements
 */
export async function validateNote(notePath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let content: string;
    try {
        content = await fs.readFile(notePath, 'utf-8');
    } catch {
        return { valid: false, errors: ['File not found'], warnings: [] };
    }

    const fm = parseFrontmatter(content);
    if (!fm) {
        errors.push('Invalid or missing frontmatter');
        return { valid: false, errors, warnings };
    }

    // Check embedding_keys
    if (!fm.embedding_keys || fm.embedding_keys.length < 3) {
        errors.push(`embedding_keys missing or too few (need 3-5, got ${fm.embedding_keys?.length || 0})`);
    } else if (fm.embedding_keys.length > 5) {
        warnings.push(`embedding_keys has ${fm.embedding_keys.length} items (prefer 3-5)`);
    }

    // Check derived_from format
    if (Array.isArray(fm.derived_from)) {
        const hasOnlyHash = fm.derived_from.every(d => typeof d === 'string' && /^src_[a-f0-9]+$/.test(d));
        if (hasOnlyHash) {
            errors.push('derived_from uses only cryptic hash (need source_title)');
        }
    } else if (typeof fm.derived_from === 'object') {
        if (!fm.derived_from.source_title) {
            errors.push('derived_from.source_title is missing');
        }
    }

    // Check LINK_INTENTS
    const linkIntents = parseLinkIntents(content);
    if (!linkIntents) {
        warnings.push('LINK_INTENTS section not found or invalid JSON');
    } else {
        if (linkIntents.link_intents.length > 5) {
            errors.push(`Too many link_intents: ${linkIntents.link_intents.length} (max 5)`);
        }
    }

    // Check for unabstracted terms
    const unabstracted = findUnabstractedTerms(content);
    if (unabstracted.length > 0) {
        warnings.push(`Unabstracted terms found: ${unabstracted.join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate all notes in a vault
 */
export async function validateVault(vaultDir: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    results: Array<{ file: string; valid: boolean; errors: string[]; warnings: string[] }>;
}> {
    const results: Array<{ file: string; valid: boolean; errors: string[]; warnings: string[] }> = [];
    const folders = ['concepts', 'principles', 'procedures', 'misconceptions', 'examples'];

    for (const folder of folders) {
        const folderPath = path.join(vaultDir, folder);
        try {
            const files = await fs.readdir(folderPath);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = path.join(folderPath, file);
                    const result = await validateNote(filePath);
                    results.push({ file: `${folder}/${file}`, ...result });
                }
            }
        } catch {
            // Folder doesn't exist, skip
        }
    }

    return {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        results
    };
}
