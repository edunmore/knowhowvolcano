/**
 * Phase 1 validation utilities (no vitest dependency)
 */

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
export function parseFrontmatter(content: string): NoteFrontmatter | null {
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
export function parseLinkIntents(content: string): LinkIntentsJson | null {
    // Try with closing backticks first
    let match = content.match(/## LINK_INTENTS\s*```json\s*([\s\S]*?)```/);

    // If not found, try without closing backticks (LLM sometimes forgets them)
    if (!match) {
        match = content.match(/## LINK_INTENTS\s*```json\s*([\s\S]*?\})\s*$/);
    }

    if (!match) return null;

    try {
        // Clean up the JSON - ensure it ends with proper closing
        let jsonStr = match[1].trim();
        // Count braces to ensure balance
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
            jsonStr += '}'.repeat(openBraces - closeBraces);
        }
        return JSON.parse(jsonStr) as LinkIntentsJson;
    } catch {
        return null;
    }
}

/**
 * Check if content contains unabstracted domain terms
 */
export function findUnabstractedTerms(content: string): string[] {
    const rungPattern = /Rung [A-D]/gi;
    const found: string[] = [];

    let match;
    while ((match = rungPattern.exec(content)) !== null) {
        // Look 50 chars back and 20 forward for attribution context
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + match[0].length + 20);
        const context = content.slice(start, end);

        // Check for various attribution patterns
        if (context.includes('author\'s "') || context.includes('(author') ||
            context.includes('author\'s') || context.includes('"Rung') ||
            context.includes('\'Rung') || context.includes('Level') || context.includes('Stage')) {
            continue;
        }
        found.push(match[0]);
    }
    return [...new Set(found)];
}

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
    totalWarnings: number;
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
        totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
        results
    };
}

// CLI runner
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || process.argv[1].includes('phase1-validator')) {
    const args = process.argv.slice(2);
    const strictMode = args.includes('--strict');
    const vaultPath = args.find(a => !a.startsWith('--')) || './benchmark/phase1-final';
    const resolvedPath = path.resolve(vaultPath);

    console.log(`\n=== Phase 1 Vault Validation ===`);
    console.log(`Vault: ${resolvedPath}`);
    if (strictMode) console.log(`Mode: STRICT (warnings = failures)`);
    console.log('');

    validateVault(resolvedPath).then(result => {
        console.log(`Total notes: ${result.total}`);
        console.log(`Valid: ${result.valid} ✅`);
        console.log(`Invalid: ${result.invalid} ❌`);
        console.log(`Warnings: ${result.totalWarnings}` + (strictMode && result.totalWarnings > 0 ? ' ⚠️ FAIL in strict mode' : ''));
        console.log(`\n--- Details ---\n`);

        for (const r of result.results) {
            const status = r.valid ? '✅' : '❌';
            console.log(`${status} ${r.file}`);
            if (r.errors.length > 0) {
                for (const e of r.errors) {
                    console.log(`   ERROR: ${e}`);
                }
            }
            if (r.warnings.length > 0) {
                for (const w of r.warnings) {
                    console.log(`   WARN: ${w}`);
                }
            }
        }

        console.log(`\n=== Summary ===`);
        console.log(`Pass rate: ${result.total > 0 ? ((result.valid / result.total) * 100).toFixed(1) : 0}%`);

        // In strict mode, any warning is a failure
        const hasFailures = result.invalid > 0 || (strictMode && result.totalWarnings > 0);
        if (hasFailures) {
            console.log(`\n❌ VALIDATION FAILED${strictMode ? ' (strict mode)' : ''}`);
        } else {
            console.log(`\n✅ VALIDATION PASSED`);
        }

        process.exit(hasFailures ? 1 : 0);
    });
}

