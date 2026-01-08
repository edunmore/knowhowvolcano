/**
 * Emergent Artifacts Utility (vNext M5)
 * 
 * Creates emergent Zettelkasten artifacts after batch processing:
 * - Book Strands: Ordered traversals following chunk/source order
 * - MOCs: Map of Content notes (curated topic overviews)
 * - Bridges: Synthesized connections between disparate concepts
 * - Trails: Learning sequences/paths
 */

import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { RunLogger } from '../run-logger.js';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { withRateLimitRetry } from './rate-limit-utils.js';

/**
 * Note metadata for artifact generation
 */
interface NoteInfo {
    path: string;
    id: string;
    title: string;
    type: string;
    derivedFrom?: string[];
}

/**
 * Load note metadata from a list of paths
 */
async function loadNoteInfos(notePaths: string[]): Promise<NoteInfo[]> {
    const infos: NoteInfo[] = [];

    for (const path of notePaths) {
        try {
            const content = await fs.readFile(path, 'utf-8');

            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = frontmatterMatch[1];
            const idMatch = frontmatter.match(/^id:\s*(.+)$/m);
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const typeMatch = frontmatter.match(/^type:\s*(.+)$/m);
            const derivedMatch = frontmatter.match(/^derived_from:\s*\[(.+)\]$/m);

            infos.push({
                path,
                id: idMatch?.[1]?.trim() || path.split('/').pop()?.replace('.md', '') || 'unknown',
                title: titleMatch?.[1]?.trim() || 'Untitled',
                type: typeMatch?.[1]?.trim() || 'note',
                derivedFrom: derivedMatch?.[1]?.split(',').map(s => s.trim().replace(/"/g, '')) || [],
            });
        } catch {
            // Skip unreadable files
        }
    }

    return infos;
}

/**
 * Create a Book Strand - ordered traversal of notes from a source
 */
export async function createBookStrand(
    vaultDir: string,
    sourceId: string,
    notePaths: string[],
    logger?: RunLogger
): Promise<string | null> {
    const notes = await loadNoteInfos(notePaths);

    // Filter to notes derived from this source
    const sourceNotes = notes.filter(n => n.derivedFrom?.includes(sourceId));
    if (sourceNotes.length === 0) {
        await logger?.log(`[BookStrand] No notes from source ${sourceId}`);
        return null;
    }

    // Sort by type priority: procedures > concepts > principles > misconceptions > examples
    const typePriority: Record<string, number> = {
        'procedure': 1, 'concept': 2, 'principle': 3, 'misconception': 4, 'example': 5
    };
    sourceNotes.sort((a, b) => (typePriority[a.type] || 99) - (typePriority[b.type] || 99));

    const strandContent = `---
id: strand-${sourceId}
type: strand
status: synthesized
source: "${sourceId}"
created: ${new Date().toISOString()}
---
# Book Strand: ${sourceId}

This strand traces the key artifacts extracted from [[${sourceId}]].

## Ordered Traversal

${sourceNotes.map((n, i) => `${i + 1}. [[${n.id}]] - ${n.title} (${n.type})`).join('\n')}

## Summary

Extracted ${sourceNotes.length} artifacts organized by conceptual flow.

---
*Auto-generated strand. Edit to add narrative connections.*
`;

    const strandDir = join(vaultDir, 'slipbox', 'strands');
    await fs.mkdir(strandDir, { recursive: true });

    const strandPath = join(strandDir, `strand-${sourceId}.md`);
    await fs.writeFile(strandPath, strandContent);

    await logger?.log(`[BookStrand] Created: ${strandPath}`);
    return strandPath;
}

/**
 * Create a simple MOC (Map of Content) grouping related notes
 */
export async function createMOC(
    vaultDir: string,
    topic: string,
    notePaths: string[],
    llm?: LLMHandle,
    logger?: RunLogger
): Promise<string | null> {
    const notes = await loadNoteInfos(notePaths);
    if (notes.length === 0) return null;

    // Group by type
    const byType: Record<string, NoteInfo[]> = {};
    for (const note of notes) {
        if (!byType[note.type]) byType[note.type] = [];
        byType[note.type].push(note);
    }

    let mocContent = `---
id: moc-${topic.toLowerCase().replace(/\s+/g, '-')}
type: moc
status: synthesized
created: ${new Date().toISOString()}
---
# Map: ${topic}

This map organizes artifacts related to **${topic}**.

`;

    for (const [type, typeNotes] of Object.entries(byType)) {
        mocContent += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
        for (const note of typeNotes) {
            mocContent += `- [[${note.id}]] - ${note.title}\n`;
        }
        mocContent += '\n';
    }

    mocContent += `---
*Auto-generated MOC. Add relationship explanations for clarity.*
`;

    const mocDir = join(vaultDir, 'slipbox', 'mocs');
    await fs.mkdir(mocDir, { recursive: true });

    const mocPath = join(mocDir, `moc-${topic.toLowerCase().replace(/\s+/g, '-')}.md`);
    await fs.writeFile(mocPath, mocContent);

    await logger?.log(`[MOC] Created: ${mocPath}`);
    return mocPath;
}

/**
 * Create a learning trail from notes
 */
export async function createTrail(
    vaultDir: string,
    trailName: string,
    notePaths: string[],
    llm?: LLMHandle,
    logger?: RunLogger
): Promise<string | null> {
    const notes = await loadNoteInfos(notePaths);
    if (notes.length === 0) return null;

    // Order: concepts first (foundational), then procedures, then principles
    const ordered = [
        ...notes.filter(n => n.type === 'concept'),
        ...notes.filter(n => n.type === 'procedure'),
        ...notes.filter(n => n.type === 'principle'),
        ...notes.filter(n => n.type === 'misconception'),
        ...notes.filter(n => n.type === 'example'),
    ];

    const trailContent = `---
id: trail-${trailName.toLowerCase().replace(/\s+/g, '-')}
type: trail
status: synthesized
created: ${new Date().toISOString()}
---
# Learning Trail: ${trailName}

Follow this trail to master the concepts in logical order.

## Prerequisites

Before starting, you should understand:
- (Add prerequisites as needed)

## Steps

${ordered.map((n, i) => `### Step ${i + 1}: ${n.title}

Read [[${n.id}]] to understand ${n.type === 'concept' ? 'the key concept' : n.type === 'procedure' ? 'how to apply this' : n.type === 'principle' ? 'the guiding principle' : 'this point'}.

`).join('')}
## Summary

This trail covers ${ordered.length} artifacts in a learning-optimized sequence.

---
*Auto-generated trail. Customize steps and add practice exercises.*
`;

    const trailDir = join(vaultDir, 'slipbox', 'trails');
    await fs.mkdir(trailDir, { recursive: true });

    const trailPath = join(trailDir, `trail-${trailName.toLowerCase().replace(/\s+/g, '-')}.md`);
    await fs.writeFile(trailPath, trailContent);

    await logger?.log(`[Trail] Created: ${trailPath}`);
    return trailPath;
}

/**
 * Create a bridge note connecting disparate concepts (requires LLM)
 */
export async function createBridge(
    vaultDir: string,
    noteA: NoteInfo,
    noteB: NoteInfo,
    llm: LLMHandle,
    logger?: RunLogger
): Promise<string | null> {
    const prompt = `You are creating a Bridge Note that synthesizes connections between two concepts.

Concept A: "${noteA.title}" (${noteA.type})
Concept B: "${noteB.title}" (${noteB.type})

Write a SHORT bridge note (max 200 words) explaining:
1. How these concepts relate
2. When to use them together
3. Key insight from the connection

Output ONLY the bridge content (no JSON, no metadata).`;

    // Log input size for visibility
    const inputChars = prompt.length;
    await logger?.log(`[BridgeCreator] ${noteA.title} ↔ ${noteB.title} | input: ${(inputChars / 1024).toFixed(1)}kb (~${Math.round(inputChars / 4)} tokens)`);

    try {
        const result = await withRateLimitRetry(
            async () => agent({ llm, name: 'BridgeCreator' }).then({ prompt }).run(),
            {
                maxRetries: 2,
                baseDelayMs: 2000,
                onRetry: async (attempt, delayMs) => {
                    await logger?.log(`[Bridge] Rate limit, retrying in ${delayMs}ms`, 'WARN');
                }
            }
        );

        const bridgeBody = result[0]?.llmOutput || '';
        if (!bridgeBody) return null;

        const bridgeId = `bridge-${noteA.id}-${noteB.id}`.slice(0, 60);
        const bridgeContent = `---
id: ${bridgeId}
type: bridge
status: synthesized
connects: ["${noteA.id}", "${noteB.id}"]
created: ${new Date().toISOString()}
---
# Bridge: ${noteA.title} ↔ ${noteB.title}

${bridgeBody.trim()}

## Connected Notes

- [[${noteA.id}]]
- [[${noteB.id}]]
`;

        const bridgeDir = join(vaultDir, 'slipbox', 'bridges');
        await fs.mkdir(bridgeDir, { recursive: true });

        const bridgePath = join(bridgeDir, `${bridgeId}.md`);
        await fs.writeFile(bridgePath, bridgeContent);

        await logger?.log(`[Bridge] Created: ${bridgePath}`);
        return bridgePath;
    } catch (e: any) {
        await logger?.log(`[Bridge] Failed: ${e.message}`, 'WARN');
        return null;
    }
}

/**
 * Generate all emergent artifacts for a source
 */
export async function generateEmergentArtifacts(
    vaultDir: string,
    sourceId: string,
    notePaths: string[],
    llm: LLMHandle,
    logger?: RunLogger
): Promise<{ strands: string[]; mocs: string[]; bridges: string[]; trails: string[] }> {
    const results = { strands: [] as string[], mocs: [] as string[], bridges: [] as string[], trails: [] as string[] };

    // 1. Create book strand
    const strand = await createBookStrand(vaultDir, sourceId, notePaths, logger);
    if (strand) results.strands.push(strand);

    // 2. Create MOC for the source topic
    const sourceName = sourceId.replace(/^src_/, '').replace(/_/g, ' ');
    const moc = await createMOC(vaultDir, sourceName, notePaths, llm, logger);
    if (moc) results.mocs.push(moc);

    // 3. Create a learning trail
    const trail = await createTrail(vaultDir, sourceName, notePaths, llm, logger);
    if (trail) results.trails.push(trail);

    // 4. Create 1-2 bridges between different types (if we have enough notes)
    const notes = await loadNoteInfos(notePaths);
    const concepts = notes.filter(n => n.type === 'concept');
    const procedures = notes.filter(n => n.type === 'procedure');

    if (concepts.length > 0 && procedures.length > 0) {
        const bridge = await createBridge(vaultDir, concepts[0], procedures[0], llm, logger);
        if (bridge) results.bridges.push(bridge);
    }

    await logger?.log(`[EmergentArtifacts] Created: ${results.strands.length} strands, ${results.mocs.length} MOCs, ${results.bridges.length} bridges, ${results.trails.length} trails`);

    return results;
}
