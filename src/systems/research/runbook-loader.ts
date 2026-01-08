import { join } from 'node:path';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';

/**
 * Runbook step definition
 */
export interface RunbookStep {
    id: string;
    type: string;
    agent?: string | null;
    prompt?: string | null;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    contracts?: Record<string, any>;
    decision_points?: Array<{
        name: string;
        allowed: Record<string, any>;
        objective?: string;
        guardrails?: Record<string, any>;
    }>;
    conditions?: Record<string, any>;
    depends_on?: string[];  // For future DAG support
}

/**
 * Runbook definition (from runbook.schema.json)
 */
export interface RunbookDefinition {
    runbook_id: string;
    version: string;
    description?: string;
    globals?: Record<string, any>;
    inputs?: Record<string, any>;
    steps: RunbookStep[];
    evaluations?: Record<string, any>;
    persistence?: Record<string, any>;
}

/**
 * Loaded runbook with resolved paths
 */
export interface LoadedRunbook {
    definition: RunbookDefinition;
    path: string;
    vaultDir: string;
}

/**
 * Load a runbook by ID from the vault
 */
export async function loadRunbook(
    vaultDir: string,
    runbookId: string
): Promise<LoadedRunbook> {
    // Try YAML first, then JSON
    const yamlPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.runbooks, `${runbookId}.yml`);
    const jsonPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.runbooks, `${runbookId}.json`);

    let content: string;
    let path: string;

    try {
        content = await fs.readFile(yamlPath, 'utf-8');
        path = yamlPath;
    } catch {
        try {
            content = await fs.readFile(jsonPath, 'utf-8');
            path = jsonPath;
        } catch {
            throw new Error(`Runbook not found: ${runbookId}`);
        }
    }

    // Parse using js-yaml for YAML files
    let definition: RunbookDefinition;
    if (path.endsWith('.yml') || path.endsWith('.yaml')) {
        definition = yaml.load(content) as RunbookDefinition;
    } else {
        definition = JSON.parse(content);
    }

    // Validate required fields
    if (!definition.runbook_id || !definition.version || !definition.steps) {
        throw new Error(`Invalid runbook: missing required fields (runbook_id, version, steps)`);
    }

    return { definition, path, vaultDir };
}


/**
 * List available runbooks in a vault
 */
export async function listRunbooks(vaultDir: string): Promise<string[]> {
    const runbooksDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runbooks);

    try {
        const entries = await fs.readdir(runbooksDir);
        return entries
            .filter(e => e.endsWith('.yml') || e.endsWith('.yaml') || e.endsWith('.json'))
            .map(e => e.replace(/\.(yml|yaml|json)$/, ''));
    } catch {
        return [];
    }
}

/**
 * Validate runbook against schema
 */
export function validateRunbook(definition: RunbookDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!definition.runbook_id) errors.push('Missing runbook_id');
    if (!definition.version) errors.push('Missing version');
    if (!definition.steps || !Array.isArray(definition.steps)) errors.push('Missing or invalid steps array');

    // Validate steps
    if (definition.steps) {
        for (let i = 0; i < definition.steps.length; i++) {
            const step = definition.steps[i];
            if (!step.id) errors.push(`Step ${i}: missing id`);
            if (!step.type) errors.push(`Step ${i}: missing type`);
        }
    }

    return { valid: errors.length === 0, errors };
}
