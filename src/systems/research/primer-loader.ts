import { join } from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { VAULT_LAYOUT } from './utils/vault-utils.js';

/**
 * Domain primer structure (from PRD-11 primer.schema.json)
 */
export interface DomainPrimer {
    schema_version: string;
    domain: {
        id: string;
        title: string;
        scope_in: string[];
        scope_out: string[];
    };
    core: string;
    ontology: {
        note_types: string[];
        link_categories?: string[];
    };
    style: {
        paraphrase_rules: string[];
        banned_patterns?: string[];
        tone?: string;
    };
    steps?: Record<string, string>;
    lenses?: Record<string, string>;
    budgets?: {
        core_max_tokens?: number;
        step_slice_max_tokens?: number;
        total_primer_max_tokens?: number;
    };
}

/**
 * Loaded primer with computed metadata
 */
export interface LoadedPrimer {
    primer: DomainPrimer;
    hash: string;
    source: 'json' | 'markdown' | 'default';
}

/**
 * Token budgets for primer injection
 */
const DEFAULT_BUDGETS = {
    core_max_tokens: 250,
    step_slice_max_tokens: 300,
    total_primer_max_tokens: 600,
};

/**
 * Approximate token count (rough estimate: 4 chars per token)
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Truncate text to approximately N tokens
 */
function truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 3) + '...';
}

/**
 * Create default primer for vaults without one
 */
function createDefaultPrimer(): DomainPrimer {
    return {
        schema_version: '1.0',
        domain: {
            id: 'general',
            title: 'General Knowledge Vault',
            scope_in: ['educational content', 'concepts', 'procedures', 'principles'],
            scope_out: ['marketing copy', 'legal text', 'about-author sections'],
        },
        core: 'This vault stores paraphrased, teachable knowledge for education and content generation.',
        ontology: {
            note_types: ['concept', 'procedure', 'principle', 'misconception'],
            link_categories: ['prerequisite_of', 'part_of', 'contrasts_with'],
        },
        style: {
            paraphrase_rules: [
                'Never copy source text verbatim (max 30 words per quote)',
                'Use neutral educator tone',
                'Write actionable definitions',
            ],
            tone: 'neutral educator',
        },
        steps: {
            gate: 'Skip marketing, TOC, legal text. Focus on core educational content.',
            modeler: 'Write actionable notes with definition, operationalization, boundary conditions.',
        },
    };
}

/**
 * Parse primer from markdown file (simpler format)
 */
async function parsePrimerMarkdown(content: string): Promise<DomainPrimer> {
    // Extract sections from markdown
    const sections: Record<string, string> = {};
    let currentSection = '';

    for (const line of content.split('\n')) {
        if (line.startsWith('## ')) {
            currentSection = line.slice(3).trim().toLowerCase().replace(/\s+/g, '_');
            sections[currentSection] = '';
        } else if (currentSection) {
            sections[currentSection] += line + '\n';
        }
    }

    // Build primer from sections
    const primer = createDefaultPrimer();

    if (sections['what_this_vault_is_for']) {
        primer.core = sections['what_this_vault_is_for'].trim();
    }
    if (sections['how_to_write_notes']) {
        primer.steps = { modeler: sections['how_to_write_notes'].trim() };
    }
    if (sections['what_to_skip']) {
        primer.steps = { ...primer.steps, gate: sections['what_to_skip'].trim() };
    }
    if (sections['links_and_stubs']) {
        primer.style.paraphrase_rules.push(sections['links_and_stubs'].trim());
    }

    return primer;
}

/**
 * Load primer from vault directory
 */
export async function loadPrimer(vaultDir: string): Promise<LoadedPrimer> {
    const jsonPath = join(vaultDir, VAULT_LAYOUT.system, 'primer.json');
    const mdPath = join(vaultDir, VAULT_LAYOUT.system, 'primer.md');

    // Try JSON first (preferred)
    try {
        const content = await fs.readFile(jsonPath, 'utf-8');
        const primer = JSON.parse(content) as DomainPrimer;
        const hash = createHash('sha1').update(content).digest('hex').slice(0, 12);
        return { primer, hash, source: 'json' };
    } catch {
        // JSON not found, try markdown
    }

    // Try markdown
    try {
        const content = await fs.readFile(mdPath, 'utf-8');
        const primer = await parsePrimerMarkdown(content);
        const hash = createHash('sha1').update(content).digest('hex').slice(0, 12);
        return { primer, hash, source: 'markdown' };
    } catch {
        // Markdown not found, use default
    }

    // Return default
    const primer = createDefaultPrimer();
    const hash = createHash('sha1').update(JSON.stringify(primer)).digest('hex').slice(0, 12);
    return { primer, hash, source: 'default' };
}

/**
 * Step types for step-aware primer slicing
 */
export type PipelineStep = 'gate' | 'extract' | 'resolve' | 'model' | 'verify' | 'story' | 'index';

/**
 * Render primer header for a specific step, respecting token budgets
 */
export function renderPrimerHeader(
    loaded: LoadedPrimer,
    step: PipelineStep,
    lensId?: string
): { header: string; sections: string[] } {
    const { primer } = loaded;
    const budgets = {
        ...DEFAULT_BUDGETS,
        ...primer.budgets,
    };

    const sections: string[] = [];
    let header = '';
    let totalTokens = 0;

    // Always include core (truncated to budget)
    const coreText = truncateToTokens(primer.core, budgets.core_max_tokens);
    header += `## Domain Context\n${coreText}\n\n`;
    totalTokens += estimateTokens(coreText);
    sections.push('core');

    // Include domain scope
    header += `**Scope**: ${primer.domain.scope_in.join(', ')}\n`;
    header += `**Exclude**: ${primer.domain.scope_out.join(', ')}\n\n`;
    sections.push('domain');

    // Include step-specific slice if available and within budget
    const stepSlice = primer.steps?.[step];
    if (stepSlice && totalTokens < budgets.total_primer_max_tokens) {
        const stepText = truncateToTokens(stepSlice, budgets.step_slice_max_tokens);
        header += `## ${step.charAt(0).toUpperCase() + step.slice(1)} Instructions\n${stepText}\n\n`;
        totalTokens += estimateTokens(stepText);
        sections.push(`step:${step}`);
    }

    // Include lens slice if available and within budget
    if (lensId && primer.lenses?.[lensId] && totalTokens < budgets.total_primer_max_tokens) {
        const remaining = budgets.total_primer_max_tokens - totalTokens;
        const lensText = truncateToTokens(primer.lenses[lensId], remaining);
        header += `## Lens: ${lensId}\n${lensText}\n\n`;
        sections.push(`lens:${lensId}`);
    }

    // Include ontology summary
    header += `**Note Types**: ${primer.ontology.note_types.join(', ')}\n`;
    sections.push('ontology');

    return { header, sections };
}

/**
 * Create a default primer.json file in the vault
 */
export async function createDefaultPrimerFile(vaultDir: string): Promise<void> {
    const primerPath = join(vaultDir, VAULT_LAYOUT.system, 'primer.json');

    try {
        await fs.access(primerPath);
        // File exists, don't overwrite
    } catch {
        // File doesn't exist, create it
        const primer = createDefaultPrimer();
        await fs.writeFile(primerPath, JSON.stringify(primer, null, 2), 'utf-8');
    }
}
