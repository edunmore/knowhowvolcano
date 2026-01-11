import type { StoredChunk, ChunkMetadata } from './chunker.js';

/**
 * Labeled window for modeling
 */
export interface ModelingWindow {
    prev?: {
        chunkId: string;
        text: string;
    };
    current: {
        chunkId: string;
        text: string;
    };
    next?: {
        chunkId: string;
        text: string;
    };
}

/**
 * Window context formatted for the modeler
 */
export interface WindowContext {
    window: ModelingWindow;
    formattedText: string;
    chunkIds: string[];
}

/**
 * Format a window into labeled text blocks for the modeler
 */
export function formatWindowForModeler(window: ModelingWindow): string {
    const blocks: string[] = [];

    if (window.prev) {
        blocks.push(`=== PREV (supporting context, ID: ${window.prev.chunkId}) ===`);
        blocks.push(window.prev.text);
        blocks.push('');
    }

    blocks.push(`=== CURRENT (authoritative, ID: ${window.current.chunkId}) ===`);
    blocks.push(window.current.text);
    blocks.push('');

    if (window.next) {
        blocks.push(`=== NEXT (supporting context, ID: ${window.next.chunkId}) ===`);
        blocks.push(window.next.text);
        blocks.push('');
    }

    return blocks.join('\n');
}

/**
 * Extract chunk IDs used in a window
 */
export function getWindowChunkIds(window: ModelingWindow): string[] {
    const ids: string[] = [];
    if (window.prev) ids.push(window.prev.chunkId);
    ids.push(window.current.chunkId);
    if (window.next) ids.push(window.next.chunkId);
    return ids;
}

/**
 * Assemble sliding windows from a list of chunks
 * Only includes chunks that passed gating (FULL_MODEL or LIGHT_SCAN)
 */
export function assembleWindows(
    chunks: StoredChunk[],
    includeDecisions: Array<'FULL_MODEL' | 'LIGHT_SCAN'> = ['FULL_MODEL']
): WindowContext[] {
    const windows: WindowContext[] = [];

    // Filter to only chunks with appropriate decisions
    const eligibleChunks = chunks.filter(c =>
        c.metadata.decision && includeDecisions.includes(c.metadata.decision as any)
    );

    // Sort by sequence number
    eligibleChunks.sort((a, b) => a.metadata.seq - b.metadata.seq);

    // Create windows
    for (let i = 0; i < eligibleChunks.length; i++) {
        const current = eligibleChunks[i];
        const prev = i > 0 ? eligibleChunks[i - 1] : undefined;
        const next = i < eligibleChunks.length - 1 ? eligibleChunks[i + 1] : undefined;

        const window: ModelingWindow = {
            current: {
                chunkId: current.metadata.id,
                text: current.content,
            },
        };

        if (prev) {
            window.prev = {
                chunkId: prev.metadata.id,
                text: prev.content,
            };
        }

        if (next) {
            window.next = {
                chunkId: next.metadata.id,
                text: next.content,
            };
        }

        windows.push({
            window,
            formattedText: formatWindowForModeler(window),
            chunkIds: getWindowChunkIds(window),
        });
    }

    return windows;
}

/**
 * Get window context for a specific chunk by ID
 */
export function getWindowForChunk(
    chunks: StoredChunk[],
    chunkId: string
): WindowContext | null {
    // Sort by sequence
    const sorted = [...chunks].sort((a, b) => a.metadata.seq - b.metadata.seq);

    const idx = sorted.findIndex(c => c.metadata.id === chunkId);
    if (idx === -1) return null;

    const current = sorted[idx];
    const prev = idx > 0 ? sorted[idx - 1] : undefined;
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : undefined;

    const window: ModelingWindow = {
        current: {
            chunkId: current.metadata.id,
            text: current.content,
        },
    };

    if (prev) {
        window.prev = {
            chunkId: prev.metadata.id,
            text: prev.content,
        };
    }

    if (next) {
        window.next = {
            chunkId: next.metadata.id,
            text: next.content,
        };
    }

    return {
        window,
        formattedText: formatWindowForModeler(window),
        chunkIds: getWindowChunkIds(window),
    };
}

/**
 * Modeler instruction for using labeled windows
 */
export const WINDOW_MODELER_INSTRUCTION = `
You receive three labeled text blocks: PREV (optional), CURRENT (authoritative), NEXT (optional).

RULES:
1. Extract/model artifacts ONLY if supported by CURRENT.
2. Use PREV/NEXT only to disambiguate or complete definitions spanning boundaries.
3. If PREV/NEXT contributes evidence materially, include those chunk IDs in derived_from.
4. All primary evidence must come from CURRENT.
`;
