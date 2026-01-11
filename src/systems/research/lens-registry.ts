import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';
import type { WindowContext } from './utils/window-assembler.js';
import type { RunLogger } from './run-logger.js';
import type { LLMHandle } from 'volcano-sdk';

/**
 * Lens metadata definition
 */
export interface LensDefinition {
    lens_id: string;
    version: string;
    description: string;
    prompt_path: string;
    output_root: string;
    routing_policy: Array<'FULL_MODEL' | 'LIGHT_SCAN'>;
    output_types: string[];
}

/**
 * Lens runner result
 */
export interface LensRunResult {
    lens_id: string;
    files_written: string[];
    canonical_ids_processed: string[];
    errors: string[];
}

/**
 * Lens runner interface
 */
export interface LensRunner {
    lens_id: string;
    run(
        llm: LLMHandle,
        windowContext: WindowContext,
        canonicalNotes: Array<{ id: string; title: string; type: string }>,
        vaultDir: string,
        logger?: RunLogger
    ): Promise<LensRunResult>;
}

/**
 * Registry of available lenses
 */
const lensRegistry = new Map<string, LensDefinition>();

/**
 * Registry of lens runners
 */
const lensRunners = new Map<string, LensRunner>();

/**
 * Register a lens definition
 */
export function registerLens(definition: LensDefinition): void {
    lensRegistry.set(definition.lens_id, definition);
}

/**
 * Register a lens runner
 */
export function registerLensRunner(runner: LensRunner): void {
    lensRunners.set(runner.lens_id, runner);
}

/**
 * Get a lens definition by ID
 */
export function getLens(lensId: string): LensDefinition | undefined {
    return lensRegistry.get(lensId);
}

/**
 * Get all registered lens IDs
 */
export function getRegisteredLensIds(): string[] {
    return Array.from(lensRegistry.keys());
}

/**
 * Get a lens runner by ID
 */
export function getLensRunner(lensId: string): LensRunner | undefined {
    return lensRunners.get(lensId);
}

/**
 * Run a specific lens
 */
export async function runLens(
    lensId: string,
    llm: LLMHandle,
    windowContext: WindowContext,
    canonicalNotes: Array<{ id: string; title: string; type: string }>,
    vaultDir: string,
    logger?: RunLogger
): Promise<LensRunResult | null> {
    const runner = lensRunners.get(lensId);
    if (!runner) {
        await logger?.log(`[Lens] No runner found for lens: ${lensId}`, 'ERROR');
        return null;
    }

    return runner.run(llm, windowContext, canonicalNotes, vaultDir, logger);
}

/**
 * Ensure lens output directories exist
 */
export async function ensureLensDirectories(vaultDir: string, lensId: string): Promise<void> {
    const lensRoot = resolveVaultPath(vaultDir, VAULT_LAYOUT.lenses, lensId);

    await fs.mkdir(join(lensRoot, 'renditions'), { recursive: true });
    await fs.mkdir(join(lensRoot, '_runs'), { recursive: true });
    await fs.mkdir(join(lensRoot, '_patches'), { recursive: true });
}

/**
 * Load lens renditions index
 */
export async function loadLensRenditionsIndex(
    vaultDir: string
): Promise<Record<string, string[]>> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'lens_renditions.json');

    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

/**
 * Update lens renditions index
 */
export async function updateLensRenditionsIndex(
    vaultDir: string,
    canonicalId: string,
    renditionId: string
): Promise<void> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'lens_renditions.json');

    // Load existing
    let index: Record<string, string[]> = {};
    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        index = JSON.parse(content);
    } catch {
        // No existing index
    }

    // Update
    if (!index[canonicalId]) {
        index[canonicalId] = [];
    }
    if (!index[canonicalId].includes(renditionId)) {
        index[canonicalId].push(renditionId);
    }

    // Write
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

// Register built-in lenses
registerLens({
    lens_id: 'lens-edu-v1',
    version: '1.0',
    description: 'Baseline educational modeling (concept/procedure/principle/misconception)',
    prompt_path: '_system/prompts/prompt-model-artifact.md',
    output_root: '', // Writes to main vault directories
    routing_policy: ['FULL_MODEL'],
    output_types: ['concept', 'procedure', 'principle', 'misconception'],
});

registerLens({
    lens_id: 'lens-dbm-v1',
    version: '1.0',
    description: 'DBM-based modeling with TOTE structure and behavioral patterns',
    prompt_path: '_system/prompts/lenses/dbm/prompt-dbm-model.md',
    output_root: '_lenses/lens-dbm-v1/',
    routing_policy: ['FULL_MODEL'],
    output_types: ['lens_rendition'],
});
