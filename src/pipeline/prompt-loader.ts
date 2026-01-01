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
 * Available prompt files
 */
export const PROMPTS = {
    CHAPTER_ROUTER: '00_CHAPTER_ROUTER.md',
    SMART_ROUTER: '01_SMART_ROUTER.md',
    EXTRACTOR_MULTI: '02_EXTRACTOR_MULTI.md',
    DELTA_EXTRACTOR: '03_DELTA_EXTRACTOR.md',
    DOWNSTREAM_CRITIC: '04_DOWNSTREAM_CRITIC.md',
    SUMMARIZER: '05_SUMMARIZER.md',
    CANON_MATCHER: '06_CANON_MATCHER.md',
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
