import { join } from 'node:path';
import fs from 'node:fs/promises';
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

    // Parse (YAML or JSON)
    let definition: RunbookDefinition;
    if (path.endsWith('.yml') || path.endsWith('.yaml')) {
        // Simple YAML parsing for common patterns
        definition = parseSimpleYaml(content);
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
 * Simple YAML parser for runbook format
 * (For production, use a proper YAML library)
 */
function parseSimpleYaml(content: string): RunbookDefinition {
    // This is a simplified parser - in production use js-yaml
    const lines = content.split('\n');
    const result: any = {};
    let currentKey = '';
    let currentArray: any[] = [];
    let inSteps = false;
    let currentStep: any = null;

    for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || line.trim() === '') continue;

        // Key-value pair
        const kvMatch = line.match(/^(\w+):\s*(.*)$/);
        if (kvMatch) {
            const [, key, value] = kvMatch;
            if (key === 'steps') {
                inSteps = true;
                result.steps = [];
            } else if (value) {
                result[key] = value.replace(/^["']|["']$/g, '');
            }
            currentKey = key;
        }

        // Array item in steps
        if (inSteps && line.match(/^\s+-\s+id:/)) {
            if (currentStep) {
                result.steps.push(currentStep);
            }
            const idMatch = line.match(/id:\s*(.+)/);
            currentStep = { id: idMatch?.[1] || '' };
        } else if (inSteps && currentStep && line.match(/^\s{4}\w+:/)) {
            const stepKv = line.match(/^\s+(\w+):\s*(.*)$/);
            if (stepKv) {
                currentStep[stepKv[1]] = stepKv[2].replace(/^["']|["']$/g, '');
            }
        }
    }

    // Add last step
    if (currentStep) {
        result.steps.push(currentStep);
    }

    return result as RunbookDefinition;
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
