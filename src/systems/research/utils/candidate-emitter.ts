/**
 * Candidate Emitter - Deterministic creation of candidate notes from LINK_CANDIDATES
 * 
 * M2 Implementation: Replaces LLM-based stub creation with pure file I/O.
 * Parses LINK_CANDIDATES from modeler output and creates incubator notes.
 */

import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { RunLogger } from '../run-logger.js';

/**
 * Link candidate parsed from modeler output
 */
export interface LinkCandidate {
    term: string;
    type_guess: 'concept' | 'procedure' | 'principle' | 'misconception' | 'unknown';
    reason: string;
    source_note?: string;  // Note that referenced this term
}

/**
 * Parse LINK_CANDIDATES from modeler output.
 * Looks for JSONL lines in a LINK_CANDIDATES section.
 */
export function parseLinkCandidates(modelerOutput: string): LinkCandidate[] {
    const candidates: LinkCandidate[] = [];

    // Find LINK_CANDIDATES section
    const linkCandidatesMatch = modelerOutput.match(/LINK_CANDIDATES\s*[\n:]\s*([\s\S]*?)(?=\n\n|$)/i);
    if (!linkCandidatesMatch) {
        // Try to find JSONL anywhere in the output
        const lines = modelerOutput.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.includes('"term"')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.term) {
                        candidates.push({
                            term: parsed.term,
                            type_guess: parsed.type_guess || 'unknown',
                            reason: parsed.reason || 'mentioned but not defined',
                            source_note: parsed.source_note,
                        });
                    }
                } catch {
                    // Skip malformed line
                }
            }
        }
        return candidates;
    }

    // Parse JSONL from the section
    const section = linkCandidatesMatch[1];
    const lines = section.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('{')) continue;

        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.term) {
                candidates.push({
                    term: parsed.term,
                    type_guess: parsed.type_guess || 'unknown',
                    reason: parsed.reason || 'mentioned but not defined',
                    source_note: parsed.source_note,
                });
            }
        } catch {
            // Skip malformed line
        }
    }

    return candidates;
}

/**
 * Generate a safe filename from a term
 */
function generateCandidateFilename(term: string, typeGuess: string): string {
    const safeName = term
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

    return `candidate-${typeGuess}-${safeName}.md`;
}

/**
 * Generate ID from term
 */
function generateCandidateId(term: string, typeGuess: string): string {
    const safeName = term
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

    return `candidate-${typeGuess}-${safeName}`;
}

/**
 * Create candidate note template
 */
function createCandidateNoteContent(candidate: LinkCandidate): string {
    const now = new Date().toISOString();
    return `---
id: ${generateCandidateId(candidate.term, candidate.type_guess)}
type: ${candidate.type_guess}
status: candidate
title: "${candidate.term}"
created: ${now}
referenced_by: ${candidate.source_note ? `["${candidate.source_note}"]` : '[]'}
---

# ${candidate.term}

> [!NOTE]
> This is a **candidate note** - a term mentioned in the source that requires further evidence to become a grounded note.

## Why This Exists

${candidate.reason}

## Evidence Needed

- [ ] Definition from source material
- [ ] Example or worked case
- [ ] Boundary conditions or exceptions

## References

${candidate.source_note ? `- [[${candidate.source_note}]]` : '- (No references yet)'}
`;
}

/**
 * Check if a note already exists in the vault (in any folder)
 */
async function noteExists(vaultDir: string, term: string): Promise<boolean> {
    const safeName = term
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

    // Check common folders
    const foldersToCheck = ['concepts', 'procedures', 'principles', 'misconceptions', 'incubator', 'slipbox'];

    for (const folder of foldersToCheck) {
        const folderPath = join(vaultDir, folder);
        try {
            const files = await fs.readdir(folderPath);
            for (const file of files) {
                if (file.toLowerCase().includes(safeName)) {
                    return true;
                }
            }
        } catch {
            // Folder doesn't exist
        }
    }

    return false;
}

/**
 * Emit candidate notes to incubator folder.
 * Does NOT use LLM - pure file I/O.
 */
export async function emitCandidates(
    candidates: LinkCandidate[],
    vaultDir: string,
    logger?: RunLogger
): Promise<{ created: number; skipped: number; paths: string[] }> {
    const incubatorDir = join(vaultDir, 'incubator');
    await fs.mkdir(incubatorDir, { recursive: true });

    let created = 0;
    let skipped = 0;
    const paths: string[] = [];

    for (const candidate of candidates) {
        // Check if note already exists
        const exists = await noteExists(vaultDir, candidate.term);
        if (exists) {
            await logger?.log(`[CandidateEmitter] Skipping "${candidate.term}" - note already exists`, 'DEBUG');
            skipped++;
            continue;
        }

        // Create candidate note
        const filename = generateCandidateFilename(candidate.term, candidate.type_guess);
        const filePath = join(incubatorDir, filename);

        // Check if candidate file already exists
        try {
            await fs.access(filePath);
            await logger?.log(`[CandidateEmitter] Skipping "${candidate.term}" - candidate already exists`, 'DEBUG');
            skipped++;
            continue;
        } catch {
            // File doesn't exist, create it
        }

        const content = createCandidateNoteContent(candidate);
        await fs.writeFile(filePath, content);

        await logger?.log(`[CandidateEmitter] Created candidate: ${filename}`);
        created++;
        paths.push(filePath);
    }

    await logger?.log(`[CandidateEmitter] Summary: created=${created}, skipped=${skipped}`);

    return { created, skipped, paths };
}

/**
 * Extract and emit candidates from modeler output in one step.
 * Convenience function for step executor.
 */
export async function extractAndEmitCandidates(
    modelerOutputs: string[],
    vaultDir: string,
    sourceNote: string,
    logger?: RunLogger
): Promise<{ created: number; skipped: number; paths: string[] }> {
    const allCandidates: LinkCandidate[] = [];

    for (const output of modelerOutputs) {
        const candidates = parseLinkCandidates(output);
        for (const candidate of candidates) {
            candidate.source_note = sourceNote;
            allCandidates.push(candidate);
        }
    }

    if (allCandidates.length === 0) {
        await logger?.log(`[CandidateEmitter] No LINK_CANDIDATES found in modeler output`);
        return { created: 0, skipped: 0, paths: [] };
    }

    await logger?.log(`[CandidateEmitter] Found ${allCandidates.length} link candidates`);
    return emitCandidates(allCandidates, vaultDir, logger);
}
