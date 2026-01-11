/**
 * Link Resolver - Zettelkasten Link Processing
 * 
 * Parses [[wikilinks]] from notes, resolves them to existing files,
 * and creates stub files for missing links based on stub_policy and confidence.
 */

import fs from 'node:fs/promises';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface LinkIntent {
    target_title: string;
    intent_type: string;
    stub_policy: 'create_with_ai_explanation' | 'create_empty' | 'ignore';
    confidence: number;
    reason: string;
}

export interface ParsedLink {
    rawText: string;          // Full [[...]] text
    targetTitle: string;      // Content inside [[...]]
    displayText?: string;     // For [[target|display]] format
    sourceFile: string;       // Which file contains this link
    lineNumber?: number;
}

export interface LinkResolutionResult {
    resolved: ParsedLink[];        // Links to existing files
    unresolved: ParsedLink[];      // Links to non-existent files
    stubsCreated: string[];        // IDs of stub files created
}

// ═══════════════════════════════════════════════════════════════════════════
// Link Parser
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract all [[wikilinks]] from markdown content
 */
export function parseWikiLinks(content: string, sourceFile: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[1];
        const pipeIndex = fullMatch.indexOf('|');

        let targetTitle: string;
        let displayText: string | undefined;

        if (pipeIndex > 0) {
            // Format: [[target|display]]
            targetTitle = fullMatch.slice(0, pipeIndex).trim();
            displayText = fullMatch.slice(pipeIndex + 1).trim();
        } else {
            // Format: [[target]]
            targetTitle = fullMatch.trim();
        }

        links.push({
            rawText: match[0],
            targetTitle,
            displayText,
            sourceFile
        });
    }

    return links;
}

/**
 * Parse LINK_INTENTS JSON block from note content
 */
export function parseLinkIntents(content: string): LinkIntent[] {
    // Simple approach: find the section and extract JSON between code fences
    const sectionStart = content.indexOf('## LINK_INTENTS');
    if (sectionStart === -1) {
        return [];
    }

    // Find the start of JSON code block after LINK_INTENTS
    const afterSection = content.slice(sectionStart);
    const codeStart = afterSection.indexOf('```json');
    if (codeStart === -1) {
        return [];
    }

    // Find the end of the code block (or end of file if missing closing ```)
    const jsonStart = afterSection.indexOf('\n', codeStart) + 1;
    let codeEnd = afterSection.indexOf('```', jsonStart);
    if (codeEnd === -1) {
        // No closing backticks - use end of string
        codeEnd = afterSection.length;
    }

    const jsonContent = afterSection.slice(jsonStart, codeEnd).trim();

    try {
        const parsed = JSON.parse(jsonContent);
        return parsed.link_intents || [];
    } catch (e) {
        console.error('[LinkResolver] Failed to parse LINK_INTENTS JSON:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Link Resolution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert title to filename slug
 */
function titleToSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
        .replace(/\s+/g, '_')           // Spaces to underscores
        .replace(/_+/g, '_')            // Collapse multiple underscores
        .replace(/^_|_$/g, '');         // Trim underscores
}

/**
 * Find existing file for a link target
 */
async function findExistingFile(vaultDir: string, targetTitle: string): Promise<string | null> {
    const slug = titleToSlug(targetTitle);
    const folders = [
        'concepts', 'procedures', 'principles', 'misconceptions', 'examples',
        'stories', 'microlearnings', 'learning_paths', 'quizzes', 'flashcards'
    ];

    for (const folder of folders) {
        const filePath = resolveVaultPath(vaultDir, folder, `${slug}.md`);
        if (existsSync(filePath)) {
            return filePath;
        }
    }

    return null;
}

/**
 * Load stub template from vault
 */
function loadStubTemplate(vaultDir: string): string {
    const templatePath = resolveVaultPath(vaultDir, '_system/templates', 'stub-note.md');
    if (existsSync(templatePath)) {
        const content = readFileSync(templatePath, 'utf-8');
        // Remove YAML frontmatter (between first two ---)
        const bodyMatch = content.match(/---[\s\S]*?---\n([\s\S]*)/);
        return bodyMatch ? bodyMatch[1] : content;
    }
    // Fallback: minimal stub if template missing
    return `---
id: {{stub_id}}
type: {{stub_type}}
status: stub
tags: [{{stub_type}}, stub]
---

# {{stub_title}}

*(Stub note - content pending)*
`;
}

/**
 * Create stub file for unresolved link
 * Template loaded from _system/templates/stub-note.md
 */
function createStubFile(
    vaultDir: string,
    targetTitle: string,
    linkIntent?: LinkIntent
): string {
    const slug = titleToSlug(targetTitle);

    // Determine folder based on intent_type or default to concepts
    let folder = 'concepts';
    if (linkIntent?.intent_type === 'procedure') folder = 'procedures';
    else if (linkIntent?.intent_type === 'principle') folder = 'principles';

    const filePath = resolveVaultPath(vaultDir, folder, `${slug}.md`);

    // Don't overwrite existing files
    if (existsSync(filePath)) {
        return filePath;
    }

    // Load template from vault and replace variables
    const noteType = linkIntent?.intent_type || 'concept';
    const reason = linkIntent?.reason || 'A term referenced in related notes that requires definition.';

    let stubContent = loadStubTemplate(vaultDir)
        .replace(/\{\{stub_id\}\}/g, slug)
        .replace(/\{\{stub_type\}\}/g, noteType)
        .replace(/\{\{stub_title\}\}/g, targetTitle)
        .replace(/\{\{reason\}\}/g, reason);

    // Ensure folder exists
    const folderPath = resolveVaultPath(vaultDir, folder);
    mkdirSync(folderPath, { recursive: true });

    // Write stub file
    writeFileSync(filePath, stubContent);

    return filePath;
}

/**
 * Resolve all links in a vault
 */
export async function resolveLinks(vaultDir: string): Promise<LinkResolutionResult> {
    const resolved: ParsedLink[] = [];
    const unresolved: ParsedLink[] = [];
    const stubsCreated: string[] = [];

    // Track which targets we've already processed to avoid duplicate stubs
    const processedTargets = new Set<string>();

    // Scan all note folders (extraction + rendition types)
    const folders = [
        'concepts', 'procedures', 'principles', 'misconceptions', 'examples',
        'stories', 'microlearnings', 'learning_paths', 'quizzes', 'flashcards'
    ];

    for (const folder of folders) {
        const folderPath = resolveVaultPath(vaultDir, folder);

        if (!existsSync(folderPath)) continue;

        const files = await fs.readdir(folderPath);

        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const filePath = join(folderPath, file);
            const content = await fs.readFile(filePath, 'utf-8');

            // Parse wikilinks from content
            const links = parseWikiLinks(content, filePath);

            // Parse link intents (if present)
            const linkIntents = parseLinkIntents(content);
            const intentMap = new Map<string, LinkIntent>();
            for (const intent of linkIntents) {
                intentMap.set(intent.target_title, intent);
            }

            // Resolve each link
            for (const link of links) {
                const existing = await findExistingFile(vaultDir, link.targetTitle);

                if (existing) {
                    resolved.push(link);
                } else {
                    unresolved.push(link);

                    // Create stub if policy allows and not already processed
                    const intent = intentMap.get(link.targetTitle);
                    const shouldCreateStub =
                        !processedTargets.has(link.targetTitle) &&
                        intent?.stub_policy !== 'ignore';

                    if (shouldCreateStub) {
                        const stubPath = createStubFile(vaultDir, link.targetTitle, intent);
                        const stubId = titleToSlug(link.targetTitle);
                        stubsCreated.push(stubId);
                        processedTargets.add(link.targetTitle);

                        console.log(`[LinkResolver] Created stub: ${stubId} (${intent?.stub_policy || 'create_empty'})`);
                    }
                }
            }
        }
    }

    return { resolved, unresolved, stubsCreated };
}

/**
 * Update stubs index file
 */
export async function updateStubsIndex(vaultDir: string, stubsCreated: string[]): Promise<void> {
    const indexDir = resolveVaultPath(vaultDir, '_index');
    mkdirSync(indexDir, { recursive: true });

    const indexPath = join(indexDir, 'stubs.json');

    // Load existing index or create new
    let existingStubs: string[] = [];
    if (existsSync(indexPath)) {
        const content = await fs.readFile(indexPath, 'utf-8');
        existingStubs = JSON.parse(content);
    }

    // Merge with new stubs (deduplicate)
    const allStubs = Array.from(new Set([...existingStubs, ...stubsCreated]));

    // Write updated index
    await fs.writeFile(indexPath, JSON.stringify(allStubs, null, 2));

    console.log(`[LinkResolver] Updated stubs index: ${allStubs.length} total stubs`);
}
