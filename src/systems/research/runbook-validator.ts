/**
 * Runbook Validator
 * 
 * Validates runbook schemas and ensures note types are supported.
 */

import fs from 'node:fs/promises';
import { parse } from 'yaml';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RunbookSchema {
    runbook_id: string;
    version: string;
    description: string;
    goals?: string[];
    prompts?: {
        coordinator?: string;
        linking_rules?: string;
    };
    output?: {
        note_types?: string[];
        required_fields?: Record<string, string[]>;
    };
    linking?: {
        inline_links?: boolean;
        link_intents_required?: boolean;
        stub_policies?: string[];
    };
    validation?: {
        enabled?: boolean;
        rules?: string[];
    };
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Known Types Registry
// ═══════════════════════════════════════════════════════════════════════════

const KNOWN_NOTE_TYPES = new Set([
    'concept',
    'procedure',
    'principle',
    'misconception',
    'example',
    'story',
    'microlearning',
    'learning_path',
    'quiz',
    'flashcard'
]);

const KNOWN_STUB_POLICIES = new Set([
    'create_with_ai_explanation',
    'create_empty',
    'ignore'
]);

// ═══════════════════════════════════════════════════════════════════════════
// Validation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate runbook schema
 */
export async function validateRunbook(
    runbookPath: string,
    vaultDir?: string
): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Load runbook
        const content = await fs.readFile(runbookPath, 'utf-8');
        const runbook: RunbookSchema = parse(content);

        // Basic structure validation
        if (!runbook.runbook_id) {
            errors.push('Missing required field: runbook_id');
        }

        if (!runbook.version) {
            errors.push('Missing required field: version');
        }

        // Validate note types
        if (runbook.output?.note_types) {
            for (const noteType of runbook.output.note_types) {
                if (!KNOWN_NOTE_TYPES.has(noteType)) {
                    errors.push(`Unknown note type: ${noteType}. Known types: ${Array.from(KNOWN_NOTE_TYPES).join(', ')}`);
                }
            }
        }

        // Validate stub policies
        if (runbook.linking?.stub_policies) {
            for (const policy of runbook.linking.stub_policies) {
                if (!KNOWN_STUB_POLICIES.has(policy)) {
                    errors.push(`Unknown stub policy: ${policy}. Known policies: ${Array.from(KNOWN_STUB_POLICIES).join(', ')}`);
                }
            }
        }

        // Validate prompt paths (if vault provided)
        if (vaultDir && runbook.prompts) {
            if (runbook.prompts.coordinator) {
                const promptPath = join(vaultDir, runbook.prompts.coordinator);
                if (!existsSync(promptPath)) {
                    errors.push(`Coordinator prompt not found: ${runbook.prompts.coordinator}`);
                }
            }

            if (runbook.prompts.linking_rules) {
                const promptPath = join(vaultDir, runbook.prompts.linking_rules);
                if (!existsSync(promptPath)) {
                    warnings.push(`Linking rules prompt not found: ${runbook.prompts.linking_rules}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };

    } catch (error) {
        return {
            valid: false,
            errors: [`Failed to parse runbook: ${error}`],
            warnings: []
        };
    }
}

/**
 * Check if a note type is valid
 */
export function isValidNoteType(noteType: string): boolean {
    return KNOWN_NOTE_TYPES.has(noteType);
}

/**
 * Get all registered note types
 */
export function getRegisteredNoteTypes(): string[] {
    return Array.from(KNOWN_NOTE_TYPES);
}

/**
 * Validate note structure against runbook schema
 */
export function validateNoteStructure(
    note: any,
    runbook: RunbookSchema
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check note type
    if (!note.type) {
        errors.push('Note missing type field');
    } else if (!isValidNoteType(note.type)) {
        errors.push(`Invalid note type: ${note.type}`);
    }

    // Check required fields (if defined in runbook)
    if (runbook.output?.required_fields) {
        const commonFields = runbook.output.required_fields.all || [];
        const typeFields = runbook.output.required_fields[note.type] || [];
        const allRequired = [...commonFields, ...typeFields];

        for (const field of allRequired) {
            if (!note[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
    }

    // Validate link intents (if required)
    if (runbook.linking?.link_intents_required && note.link_intents) {
        if (!Array.isArray(note.link_intents)) {
            errors.push('link_intents must be an array');
        } else {
            for (const intent of note.link_intents) {
                if (!intent.target_title) {
                    errors.push('link_intent missing target_title');
                }
                if (!intent.stub_policy || !KNOWN_STUB_POLICIES.has(intent.stub_policy)) {
                    errors.push(`Invalid stub_policy: ${intent.stub_policy}`);
                }
                if (typeof intent.confidence !== 'number' || intent.confidence < 0 || intent.confidence > 1) {
                    errors.push(`Invalid confidence (must be 0-1): ${intent.confidence}`);
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
