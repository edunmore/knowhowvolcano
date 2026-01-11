import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';

/**
 * NKM Item (from nkm.schema.json)
 */
export interface NKMItem {
    canonical_id: string | null;
    item_type: 'concept' | 'procedure' | 'principle' | 'misconception' | 'definition' | 'example';
    title: string;
    aliases: string[];
    facets: Record<string, any>;
    evidence: Record<string, any>;
    match_method?: 'exact' | 'alias' | 'resolver' | 'none' | null;
    match_confidence?: number | null;
}

/**
 * NKM Relation
 */
export interface NKMRelation {
    source_id: string | null;
    relation: 'prerequisite_of' | 'part_of' | 'contrasts_with' | 'causes' | 'supports';
    target_id: string | null;
}

/**
 * Normalized Knowledge Manifest
 */
export interface NormalizedKnowledgeManifest {
    schema_version: string;
    topic_id: string;
    source: 'target' | 'recovered';
    items: NKMItem[];
    relations: NKMRelation[];
    meta: Record<string, any>;
}

/**
 * Build target NKM from vault canonical notes
 */
export async function buildTargetNKM(
    vaultDir: string,
    topicId: string
): Promise<NormalizedKnowledgeManifest> {
    const nkm: NormalizedKnowledgeManifest = {
        schema_version: '1.0',
        topic_id: topicId,
        source: 'target',
        items: [],
        relations: [],
        meta: {
            built_at: new Date().toISOString(),
            vault_dir: vaultDir,
        },
    };

    // Scan note directories
    const noteTypes = ['concepts', 'procedures', 'principles', 'misconceptions'];

    for (const noteType of noteTypes) {
        const noteDir = resolveVaultPath(vaultDir, noteType);

        try {
            const files = await fs.readdir(noteDir);

            for (const file of files.filter(f => f.endsWith('.md'))) {
                const content = await fs.readFile(join(noteDir, file), 'utf-8');
                const item = parseNoteToNKMItem(content, noteType.slice(0, -1) as NKMItem['item_type']);
                if (item) {
                    nkm.items.push(item);
                }
            }
        } catch {
            // Directory doesn't exist or is empty
        }
    }

    return nkm;
}

/**
 * Parse a vault note into an NKM item
 */
function parseNoteToNKMItem(content: string, itemType: NKMItem['item_type']): NKMItem | null {
    try {
        // Extract YAML frontmatter
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!yamlMatch) return null;

        const yamlContent = yamlMatch[1];

        // Parse basic YAML fields
        const idMatch = yamlContent.match(/^id:\s*(.+)$/m);
        const id = idMatch ? idMatch[1].trim() : null;
        if (!id) return null;

        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : id;

        // Extract aliases if present
        const aliasMatch = yamlContent.match(/^aliases:\s*\[(.*)\]$/m);
        const aliases: string[] = aliasMatch
            ? aliasMatch[1].split(',').map(a => a.trim().replace(/"/g, ''))
            : [];

        // Extract facets from sections
        const facets: Record<string, string> = {};
        const sectionRegex = /^##\s+(.+)\n([\s\S]*?)(?=^##|\Z)/gm;
        let sectionMatch;
        while ((sectionMatch = sectionRegex.exec(content)) !== null) {
            const sectionName = sectionMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
            const sectionContent = sectionMatch[2].trim();
            if (sectionContent) {
                facets[sectionName] = sectionContent;
            }
        }

        // Extract derived_from as evidence
        const derivedFromMatch = yamlContent.match(/^derived_from:\s*\[(.*)\]$/m);
        const evidence: Record<string, any> = {};
        if (derivedFromMatch) {
            evidence.derived_from = derivedFromMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
        }

        return {
            canonical_id: id,
            item_type: itemType,
            title,
            aliases,
            facets,
            evidence,
            match_method: 'exact',
            match_confidence: 1.0,
        };
    } catch {
        return null;
    }
}

/**
 * Round-trip comparison report
 */
export interface RoundTripReport {
    precision: number;
    recall: number;
    f1: number;
    extras_rate: number;
    manifest_alignment: number;
    contradiction_rate: number;
    details: {
        target_count: number;
        recovered_count: number;
        matched_count: number;
        missing: string[];
        extras: string[];
    };
}

/**
 * Compare target vs recovered NKM
 */
export function compareNKMs(
    target: NormalizedKnowledgeManifest,
    recovered: NormalizedKnowledgeManifest
): RoundTripReport {
    // Build sets of canonical IDs
    const targetIds = new Set(target.items.map(i => i.canonical_id).filter(Boolean) as string[]);
    const recoveredIds = new Set(recovered.items.map(i => i.canonical_id).filter(Boolean) as string[]);

    // Also check by title for items without canonical_id
    const targetTitles = new Set(target.items.map(i => i.title.toLowerCase()));
    const recoveredTitles = new Set(recovered.items.map(i => i.title.toLowerCase()));

    // Calculate matches
    const matchedById = new Set([...targetIds].filter(id => recoveredIds.has(id)));
    const matchedByTitle = new Set([...targetTitles].filter(t => recoveredTitles.has(t)));

    const totalMatched = matchedById.size +
        [...matchedByTitle].filter(t => !matchedById.has(t)).length;

    // Calculate missing and extras
    const missing = target.items
        .filter(i => {
            if (i.canonical_id && recoveredIds.has(i.canonical_id)) return false;
            if (recoveredTitles.has(i.title.toLowerCase())) return false;
            return true;
        })
        .map(i => i.canonical_id || i.title);

    const extras = recovered.items
        .filter(i => {
            if (i.canonical_id && targetIds.has(i.canonical_id)) return false;
            if (targetTitles.has(i.title.toLowerCase())) return false;
            return true;
        })
        .map(i => i.canonical_id || i.title);

    // Calculate metrics
    const precision = recovered.items.length > 0
        ? totalMatched / recovered.items.length
        : 0;
    const recall = target.items.length > 0
        ? totalMatched / target.items.length
        : 0;
    const f1 = (precision + recall) > 0
        ? 2 * (precision * recall) / (precision + recall)
        : 0;
    const extrasRate = recovered.items.length > 0
        ? extras.length / recovered.items.length
        : 0;

    return {
        precision,
        recall,
        f1,
        extras_rate: extrasRate,
        manifest_alignment: recall, // Simplified: same as recall
        contradiction_rate: 0, // Not implemented yet
        details: {
            target_count: target.items.length,
            recovered_count: recovered.items.length,
            matched_count: totalMatched,
            missing,
            extras,
        },
    };
}

/**
 * Save round-trip report
 */
export async function saveRoundTripReport(
    vaultDir: string,
    scenarioId: string,
    runId: string,
    report: RoundTripReport
): Promise<string> {
    const reportDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runs, scenarioId, runId);
    await fs.mkdir(reportDir, { recursive: true });

    const reportPath = join(reportDir, 'roundtrip.report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    return reportPath;
}
