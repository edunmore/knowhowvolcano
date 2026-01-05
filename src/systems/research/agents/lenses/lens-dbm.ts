import { join } from 'node:path';
import fs from 'node:fs/promises';
import {
    registerLensRunner,
    ensureLensDirectories,
    updateLensRenditionsIndex,
    type LensRunner,
    type LensRunResult
} from '../../lens-registry.js';
import { resolveVaultPath, VAULT_LAYOUT } from '../../utils/vault-utils.js';
import type { WindowContext } from '../../utils/window-assembler.js';
import type { RunLogger } from '../../run-logger.js';
import type { LLMHandle } from 'volcano-sdk';

const LENS_ID = 'lens-dbm-v1';

/**
 * Load the DBM prompt template
 */
async function loadDbmPrompt(vaultDir: string): Promise<string> {
    const promptPath = resolveVaultPath(
        vaultDir,
        VAULT_LAYOUT.prompts,
        'lenses/dbm/prompt-dbm-model.md'
    );

    try {
        return await fs.readFile(promptPath, 'utf-8');
    } catch {
        // Return default prompt if not found
        return `Return ONLY Markdown for a single DBM rendition note. No JSON. No commentary.

You are a DBM-based Modeler operating under strict grounding.

You receive PREV (supporting), CURRENT (authoritative), NEXT (supporting) and a target canonical note id/title.
Rules:
- Extract only what is supported by CURRENT.
- Use PREV/NEXT only to disambiguate or complete definitions spanning boundaries.
- If you use PREV/NEXT materially, include their chunk IDs in derived_from.
- No placeholder-only sections. Use Gap Statements when missing:
  "Not specified in this source. Open questions: (1) …? (2) …?"
- Quote limit: each verbatim quote ≤ 30 words; prefer paraphrase.

Output YAML (required):
- id: <canonical_id>--lens-dbm-v1
- type: lens_rendition
- lens_id: lens-dbm-v1
- renders: <canonical_id>
- derived_from: [<chunk_ids used>]
- modeled_at: <ISO timestamp>
- tags: [lens, dbm, rendition]

Required sections:
# DBM Rendition — <Title>

## DBM frame
## TOTE
## Observable indicators
## Failure modes
## Calibration cues
## Prompts/Interventions
## Gaps
## Links

Inputs:
CANONICAL:
- id: {{canonical_id}}
- title: {{canonical_title}}

EVIDENCE IDS:
- prev_chunk_id: {{prev_chunk_id}}
- current_chunk_id: {{current_chunk_id}}
- next_chunk_id: {{next_chunk_id}}

TEXT:
{{window_text}}
`;
    }
}

/**
 * Render the DBM prompt with context
 */
function renderDbmPrompt(
    template: string,
    canonicalId: string,
    canonicalTitle: string,
    windowContext: WindowContext
): string {
    const { window, formattedText } = windowContext;

    return template
        .replace('{{canonical_id}}', canonicalId)
        .replace('{{canonical_title}}', canonicalTitle)
        .replace('{{prev_chunk_id}}', window.prev?.chunkId || 'none')
        .replace('{{current_chunk_id}}', window.current.chunkId)
        .replace('{{next_chunk_id}}', window.next?.chunkId || 'none')
        .replace('{{window_text}}', formattedText);
}

/**
 * DBM Lens Runner implementation
 */
const dbmLensRunner: LensRunner = {
    lens_id: LENS_ID,

    async run(
        llm: LLMHandle,
        windowContext: WindowContext,
        canonicalNotes: Array<{ id: string; title: string; type: string }>,
        vaultDir: string,
        logger?: RunLogger
    ): Promise<LensRunResult> {
        const result: LensRunResult = {
            lens_id: LENS_ID,
            files_written: [],
            canonical_ids_processed: [],
            errors: [],
        };

        // Ensure lens directories exist
        await ensureLensDirectories(vaultDir, LENS_ID);

        // Load prompt template
        const promptTemplate = await loadDbmPrompt(vaultDir);

        // Process each canonical note (Mode A: Opportunistic)
        for (const note of canonicalNotes) {
            try {
                await logger?.log(`[DBM Lens] Processing: ${note.title} (${note.id})`);

                // Render prompt
                const prompt = renderDbmPrompt(
                    promptTemplate,
                    note.id,
                    note.title,
                    windowContext
                );

                // Call LLM
                const response = await llm.generateText(prompt, {
                    temperature: 0.3,
                });

                // Build rendition ID
                const renditionId = `${note.id}--${LENS_ID}`;

                // Add modeled_at if not present
                let content = response;
                if (!content.includes('modeled_at:')) {
                    content = content.replace(
                        /tags: \[.*\]/,
                        `$&\nmodeled_at: ${new Date().toISOString()}`
                    );
                }

                // Write rendition file
                const renditionPath = resolveVaultPath(
                    vaultDir,
                    VAULT_LAYOUT.lenses,
                    LENS_ID,
                    'renditions',
                    `${renditionId}.md`
                );

                await fs.writeFile(renditionPath, content, 'utf-8');
                result.files_written.push(renditionPath);
                result.canonical_ids_processed.push(note.id);

                // Update index
                await updateLensRenditionsIndex(vaultDir, note.id, renditionId);

                await logger?.log(`[DBM Lens] Created rendition: ${renditionId}`);

            } catch (error: any) {
                const errMsg = `Failed to process ${note.id}: ${error.message}`;
                result.errors.push(errMsg);
                await logger?.log(`[DBM Lens] ${errMsg}`, 'ERROR');
            }
        }

        return result;
    }
};

// Register the runner
registerLensRunner(dbmLensRunner);

export { dbmLensRunner };
