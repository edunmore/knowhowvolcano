/**
 * Prompt Loader - Centralized prompt loading from PROMPTS folder
 * 
 * All prompts are externalized in the PROMPTS folder.
 * This module provides utilities to load and use them.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the prompts directory (relative to this file's location)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, '..', '..', 'PROMPTS');

/**
 * Available prompt files (numbered by pipeline execution order)
 */
export const PROMPTS = {
    // 01 - Summarizer (optional pre-step)
    SUMMARIZER: '01_SUMMARIZER.md',
    // 02/03 - Routing
    CHAPTER_ROUTER: '02_CHAPTER_ROUTER.md',
    SMART_ROUTER: '03_SMART_ROUTER.md',
    // 04 - Extraction
    EXTRACTOR_MULTI: '04_EXTRACTOR.md',
    // 05 - Critique
    DOWNSTREAM_CRITIC: '05_CRITIC.md',
    // 06 - Matching
    CANON_MATCHER: '06_MATCHER.md',
    // 07 - Delta update
    DELTA_EXTRACTOR: '07_DELTA_EXTRACTOR.md',
} as const;

export type PromptName = keyof typeof PROMPTS;

/**
 * Load a prompt file from the PROMPTS directory
 */
export function loadPrompt(name: PromptName): string {
    const filename = PROMPTS[name];
    const filepath = join(PROMPTS_DIR, filename);

    if (!existsSync(filepath)) {
        throw new Error(`Prompt file not found: ${filename} (expected at ${filepath})`);
    }

    return readFileSync(filepath, 'utf-8');
}

/**
 * Load a prompt and replace placeholders with values
 */
export function loadPromptWithValues(
    name: PromptName,
    values: Record<string, string>
): string {
    let prompt = loadPrompt(name);

    for (const [key, value] of Object.entries(values)) {
        prompt = prompt.replaceAll(`{${key}}`, value);
    }

    return prompt;
}

/**
 * Get the path to a prompt file
 */
export function getPromptPath(name: PromptName): string {
    return join(PROMPTS_DIR, PROMPTS[name]);
}
