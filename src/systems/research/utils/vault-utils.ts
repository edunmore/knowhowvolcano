import { join, dirname } from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * Path to the template vault (source of prompts/schemas)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const TEMPLATE_VAULT_PATH = join(__dirname, '..', 'vault');

/**
 * Vault metadata stored in _system/vault.json
 */
export interface VaultMetadata {
    vault_id: string;
    title: string;
    domain_tags: string[];
    created_at: string;
}

/**
 * Standard vault directory structure
 */
export const VAULT_LAYOUT = {
    system: '_system',
    prompts: '_system/prompts',
    schemas: '_system/schemas',
    scenarios: '_system/step_scenarios',
    runbooks: '_system/runbooks',
    runs: '_runs',
    index: '_index',
    lenses: '_lenses',
    sources: '_sources',
    concepts: 'concepts',
    procedures: 'procedures',
    principles: 'principles',
    misconceptions: 'misconceptions',
    examples: 'examples',
    stories: 'stories',
} as const;

/**
 * Recursively copy directory contents
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            // Only copy if destination doesn't exist (don't overwrite user customizations)
            try {
                await fs.access(destPath);
                // File exists, skip
            } catch {
                // File doesn't exist, copy it
                await fs.copyFile(srcPath, destPath);
            }
        }
    }
}

/**
 * Copy template _system contents to a new vault
 */
export async function copyTemplateSystem(vaultDir: string): Promise<boolean> {
    const templateSystem = join(TEMPLATE_VAULT_PATH, '_system');
    const targetSystem = join(vaultDir, '_system');

    try {
        await fs.access(templateSystem);
        await copyDirectory(templateSystem, targetSystem);
        return true;
    } catch (error) {
        // Template vault not found - this is OK in production where vault is embedded
        console.warn(`Template vault not found at ${templateSystem}. Prompts must be provided manually.`);
        return false;
    }
}

/**
 * Ensure standard vault directory layout exists
 */
export async function ensureVaultLayout(vaultDir: string): Promise<void> {
    const dirsToCreate = [
        VAULT_LAYOUT.system,
        VAULT_LAYOUT.prompts,
        VAULT_LAYOUT.schemas,
        VAULT_LAYOUT.scenarios,
        VAULT_LAYOUT.runbooks,
        VAULT_LAYOUT.runs,
        VAULT_LAYOUT.index,
        VAULT_LAYOUT.lenses,
        VAULT_LAYOUT.sources,
        VAULT_LAYOUT.concepts,
        VAULT_LAYOUT.procedures,
        VAULT_LAYOUT.principles,
        VAULT_LAYOUT.misconceptions,
        VAULT_LAYOUT.examples,
        VAULT_LAYOUT.stories,
    ];

    for (const dir of dirsToCreate) {
        await fs.mkdir(join(vaultDir, dir), { recursive: true });
    }

    // Auto-copy template _system if prompts don't exist
    const promptsDir = join(vaultDir, VAULT_LAYOUT.prompts);
    try {
        const promptFiles = await fs.readdir(promptsDir);
        if (promptFiles.length === 0) {
            await copyTemplateSystem(vaultDir);
        }
    } catch {
        // Prompts dir empty or doesn't exist, copy template
        await copyTemplateSystem(vaultDir);
    }
}

/**
 * Create vault.json metadata if it doesn't exist
 */
export async function ensureVaultMetadata(vaultDir: string): Promise<VaultMetadata> {
    const metadataPath = join(vaultDir, VAULT_LAYOUT.system, 'vault.json');

    try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        return JSON.parse(content) as VaultMetadata;
    } catch {
        // Create default metadata
        const vaultId = createHash('sha1')
            .update(vaultDir)
            .digest('hex')
            .slice(0, 12);

        const metadata: VaultMetadata = {
            vault_id: vaultId,
            title: 'Knowledge Vault',
            domain_tags: ['general'],
            created_at: new Date().toISOString(),
        };

        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        return metadata;
    }
}

/**
 * Resolve a path relative to vault root
 */
export function resolveVaultPath(vaultDir: string, ...segments: string[]): string {
    return join(vaultDir, ...segments);
}

/**
 * Get standard vault paths
 */
export function getVaultPaths(vaultDir: string) {
    return {
        system: resolveVaultPath(vaultDir, VAULT_LAYOUT.system),
        prompts: resolveVaultPath(vaultDir, VAULT_LAYOUT.prompts),
        schemas: resolveVaultPath(vaultDir, VAULT_LAYOUT.schemas),
        scenarios: resolveVaultPath(vaultDir, VAULT_LAYOUT.scenarios),
        runbooks: resolveVaultPath(vaultDir, VAULT_LAYOUT.runbooks),
        runs: resolveVaultPath(vaultDir, VAULT_LAYOUT.runs),
        index: resolveVaultPath(vaultDir, VAULT_LAYOUT.index),
        lenses: resolveVaultPath(vaultDir, VAULT_LAYOUT.lenses),
        sources: resolveVaultPath(vaultDir, VAULT_LAYOUT.sources),
        concepts: resolveVaultPath(vaultDir, VAULT_LAYOUT.concepts),
        procedures: resolveVaultPath(vaultDir, VAULT_LAYOUT.procedures),
        principles: resolveVaultPath(vaultDir, VAULT_LAYOUT.principles),
        misconceptions: resolveVaultPath(vaultDir, VAULT_LAYOUT.misconceptions),
        stories: resolveVaultPath(vaultDir, VAULT_LAYOUT.stories),
    };
}

