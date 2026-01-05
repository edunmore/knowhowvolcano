import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';
import type { RunLogger } from '../run-logger.js';

/**
 * Link candidate parsed from note content
 */
export interface LinkCandidate {
    term: string;
    reason: 'named_entity' | 'technical_term' | 'prerequisite' | 'related_construct' | 'ambiguous';
    context?: string; // Optional: sentence where term appears
}

/**
 * Resolution result for a candidate
 */
export interface ResolvedLink {
    term: string;
    resolved_id: string | null;  // null if stub needed
    match_type: 'exact' | 'alias' | 'fuzzy' | 'stub';
    confidence: number;
}

/**
 * Vault index entry (from notes.json)
 */
interface IndexEntry {
    id: string;
    path: string;
    title: string;
    type: string;
    aliases?: string[];
}

/**
 * Load vault index
 */
async function loadVaultIndex(vaultDir: string): Promise<IndexEntry[]> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'notes.json');

    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(content) as IndexEntry[];
    } catch {
        return [];
    }
}

/**
 * Normalize term for matching
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Find best match for a term in the vault index
 */
function findMatch(term: string, index: IndexEntry[]): ResolvedLink {
    const normalizedTerm = normalize(term);

    // 1. Exact ID match
    for (const entry of index) {
        if (normalize(entry.id) === normalizedTerm) {
            return { term, resolved_id: entry.id, match_type: 'exact', confidence: 1.0 };
        }
    }

    // 2. Exact title match
    for (const entry of index) {
        if (normalize(entry.title) === normalizedTerm) {
            return { term, resolved_id: entry.id, match_type: 'exact', confidence: 0.95 };
        }
    }

    // 3. Alias match
    for (const entry of index) {
        if (entry.aliases) {
            for (const alias of entry.aliases) {
                if (normalize(alias) === normalizedTerm) {
                    return { term, resolved_id: entry.id, match_type: 'alias', confidence: 0.9 };
                }
            }
        }
    }

    // 4. Fuzzy match (term contained in title or vice versa)
    for (const entry of index) {
        const normalizedTitle = normalize(entry.title);
        if (normalizedTitle.includes(normalizedTerm) || normalizedTerm.includes(normalizedTitle)) {
            return { term, resolved_id: entry.id, match_type: 'fuzzy', confidence: 0.7 };
        }
    }

    // 5. No match - needs stub
    return { term, resolved_id: null, match_type: 'stub', confidence: 0 };
}

/**
 * Parse link candidates from note content
 */
export function parseLinkCandidates(noteContent: string): LinkCandidate[] {
    const candidates: LinkCandidate[] = [];

    // Find "## Link candidates" or "## Link Candidates" section
    const sectionMatch = noteContent.match(/## Link [Cc]andidates\n([\s\S]*?)(?=\n## |\n---|\Z)/);
    if (!sectionMatch) return candidates;

    const sectionContent = sectionMatch[1];

    // Parse each line: "- Term (reason)" or "[[Term]] reason:tag" or "- [[Term]] reason:tag"
    const lines = sectionContent.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Format 1: [[Term]] reason:tag
        const format1 = line.match(/\[\[([^\]]+)\]\]\s*reason:(\w+)/);
        if (format1) {
            candidates.push({
                term: format1[1].trim(),
                reason: format1[2] as LinkCandidate['reason'],
            });
            continue;
        }

        // Format 2: - Term (reason)
        const format2 = line.match(/^-\s*(.+?)\s*\((\w+)\)\s*$/);
        if (format2) {
            candidates.push({
                term: format2[1].trim(),
                reason: format2[2] as LinkCandidate['reason'],
            });
            continue;
        }

        // Format 3: - [[Term]] (reason)
        const format3 = line.match(/^-\s*\[\[([^\]]+)\]\]\s*\((\w+)\)/);
        if (format3) {
            candidates.push({
                term: format3[1].trim(),
                reason: format3[2] as LinkCandidate['reason'],
            });
            continue;
        }

        // Format 4: Just a term on a line
        const format4 = line.match(/^-\s*(.+)$/);
        if (format4 && !format4[1].includes('reason:')) {
            candidates.push({
                term: format4[1].trim().replace(/^\[\[|\]\]$/g, ''),
                reason: 'related_construct',
            });
        }
    }

    return candidates;
}

/**
 * Create a stub note for an unresolved term
 */
async function createStub(
    term: string,
    reason: LinkCandidate['reason'],
    vaultDir: string,
    logger?: RunLogger
): Promise<string> {
    // Generate ID from term
    const stubId = `concept-${term.toLowerCase().replace(/[^\w]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
    const stubPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.concepts, `${stubId}.md`);

    // Check if already exists
    try {
        await fs.access(stubPath);
        return stubId; // Already exists
    } catch {
        // Create stub
    }

    const stubContent = `---
id: ${stubId}
type: concept
status: stub
tags: [concept, stub]
---
# ${term}

## Scope
${getReasonDescription(reason)}

## Open Questions
- What is the precise definition of "${term}"?
- How does it relate to other concepts in this vault?

## Links
(None yet)
`;

    await fs.writeFile(stubPath, stubContent, 'utf-8');
    await logger?.log(`[LinkResolver] Created stub: ${stubId}`);

    return stubId;
}

/**
 * Get description for stub based on reason
 */
function getReasonDescription(reason: LinkCandidate['reason']): string {
    switch (reason) {
        case 'named_entity':
            return 'A named entity (person, organization, framework) mentioned in the source material.';
        case 'technical_term':
            return 'A technical term from the source domain that requires definition.';
        case 'prerequisite':
            return 'A concept that appears to be prerequisite knowledge for understanding related content.';
        case 'related_construct':
            return 'A concept that appears related to other vault content.';
        case 'ambiguous':
            return 'A term whose exact meaning or scope is unclear from context.';
        default:
            return 'A concept that requires further definition.';
    }
}

/**
 * Inject wikilinks into note content
 */
function injectWikilinks(
    content: string,
    resolutions: Array<{ term: string; linkId: string }>
): string {
    let result = content;

    // Sort by term length (longest first) to avoid partial replacements
    const sorted = [...resolutions].sort((a, b) => b.term.length - a.term.length);

    for (const { term, linkId } of sorted) {
        // Only inject in main content sections (not in YAML, not in Link candidates, not already linked)
        // Find term in content and wrap with [[id]]
        const termRegex = new RegExp(`(?<![\\[\\w])${escapeRegex(term)}(?![\\]\\w])`, 'gi');

        // Only replace in body (after YAML, before Link candidates)
        const yamlEnd = content.indexOf('---', 4);
        const linkCandidatesStart = content.search(/## Link [Cc]andidates/);

        if (yamlEnd > 0) {
            const bodyStart = yamlEnd + 4;
            const bodyEnd = linkCandidatesStart > 0 ? linkCandidatesStart : content.length;

            const before = result.slice(0, bodyStart);
            let body = result.slice(bodyStart, bodyEnd);
            const after = result.slice(bodyEnd);

            // Replace first occurrence only to avoid over-linking
            body = body.replace(termRegex, `[[${linkId}|${term}]]`);

            result = before + body + after;
        }
    }

    return result;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve links in a single note
 */
export async function resolveNoteLinks(
    notePath: string,
    vaultDir: string,
    logger?: RunLogger
): Promise<{ updatedContent: string; resolved: ResolvedLink[]; stubsCreated: string[] }> {
    const content = await fs.readFile(notePath, 'utf-8');
    const candidates = parseLinkCandidates(content);

    if (candidates.length === 0) {
        return { updatedContent: content, resolved: [], stubsCreated: [] };
    }

    await logger?.log(`[LinkResolver] Found ${candidates.length} candidates in ${notePath}`);

    const index = await loadVaultIndex(vaultDir);
    const resolved: ResolvedLink[] = [];
    const stubsCreated: string[] = [];
    const injectList: Array<{ term: string; linkId: string }> = [];

    for (const candidate of candidates) {
        const resolution = findMatch(candidate.term, index);
        resolved.push(resolution);

        let linkId: string;

        if (resolution.resolved_id) {
            // Found in vault
            linkId = resolution.resolved_id;
        } else {
            // Create stub
            linkId = await createStub(candidate.term, candidate.reason, vaultDir, logger);
            stubsCreated.push(linkId);
        }

        injectList.push({ term: candidate.term, linkId });
    }

    // Inject wikilinks into content
    const updatedContent = injectWikilinks(content, injectList);

    // Write updated content back
    if (updatedContent !== content) {
        await fs.writeFile(notePath, updatedContent, 'utf-8');
        await logger?.log(`[LinkResolver] Updated ${notePath} with ${injectList.length} links`);
    }

    return { updatedContent, resolved, stubsCreated };
}

/**
 * Resolve links in all notes in a directory
 */
export async function resolveLinksInVault(
    vaultDir: string,
    logger?: RunLogger
): Promise<{ totalResolved: number; totalStubs: number }> {
    const noteDirs = [
        VAULT_LAYOUT.concepts,
        VAULT_LAYOUT.procedures,
        VAULT_LAYOUT.principles,
        VAULT_LAYOUT.misconceptions,
    ];

    let totalResolved = 0;
    let totalStubs = 0;

    for (const noteDir of noteDirs) {
        const dirPath = resolveVaultPath(vaultDir, noteDir);

        try {
            const files = await fs.readdir(dirPath);

            for (const file of files.filter(f => f.endsWith('.md'))) {
                const notePath = join(dirPath, file);
                const result = await resolveNoteLinks(notePath, vaultDir, logger);

                totalResolved += result.resolved.length;
                totalStubs += result.stubsCreated.length;
            }
        } catch {
            // Directory doesn't exist
        }
    }

    await logger?.log(`[LinkResolver] Total: ${totalResolved} links resolved, ${totalStubs} stubs created`);

    return { totalResolved, totalStubs };
}
