import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join } from 'node:path';
import { renderPrompt } from '../prompt-renderer.js';
import { RunLogger } from '../run-logger.js';
import fs from 'node:fs/promises';

interface VerificationResult {
    pass: boolean;
    issues: string[];
    repaired_content?: string | null;
}

export async function runVerifier(
    llm: LLMHandle,
    notePath: string,
    vaultDir: string,
    logger: RunLogger,
    sourceContent?: string
): Promise<{ pass: boolean; issues: string[] }> {
    const filename = notePath.split('/').pop() || 'unknown';
    // Naive type detection from filename or frontmatter could be better, 
    // but let's assume type is embedded in filename for now (e.g. concept-foo.md)
    let type = 'note';
    if (filename.startsWith('concept-')) type = 'concept';
    else if (filename.startsWith('procedure-')) type = 'procedure';
    else if (filename.startsWith('principle-')) type = 'principle';
    else if (filename.startsWith('misconception-')) type = 'misconception';
    else if (filename.startsWith('story-')) type = 'story';

    // Skip verification for non-core types for now
    if (type === 'note') return { pass: true, issues: [] };

    await logger.log(`Verifying: ${filename} (${type})`);

    const content = await fs.readFile(notePath, 'utf-8');
    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-verify-note.md');

    const prompt = await renderPrompt(promptPath, {
        note_content: content,
        note_type: type
    });

    const initialResult = await agent({ llm, name: 'QA-Verifier' })
        .then({ prompt })
        .run();

    // Log the prompt filename
    await logger.log(`[prompt-verify-note.md]:\n${prompt}`, 'DEBUG');

    const rawOutput = initialResult[0]?.llmOutput || '{}';
    const cleanJson = rawOutput.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    let result: VerificationResult = { pass: true, issues: [] };

    try {
        result = JSON.parse(cleanJson) as VerificationResult;
    } catch (e: any) {
        await logger.log(`Failed to parse verification result: ${e.message}`, 'ERROR');
        // Continue, but maybe mark failed? For now, soft fail.
    }

    // 4. Grounding Verification (Optional, if source is provided)
    if (result.pass && sourceContent) {
        await logger.log(`Running Grounding Check against source...`, 'DEBUG');
        const groundingPromptPath = join(vaultDir, '_system', 'prompts', 'prompt-verify-grounding.md');

        // Ensure prompt-verify-grounding prompt variables match what we pass
        const gPrompt = await renderPrompt(groundingPromptPath, {
            source_text: sourceContent.slice(0, 15000), // Limit context if needed
            note_content: content
        });

        const gResult = await agent({ llm, name: 'Verifier-Grounding' })
            .then({ prompt: gPrompt })
            .run();

        await logger.log(`[prompt-verify-grounding.md]:\n${gPrompt}`, 'DEBUG');

        const gOutput = gResult[0]?.llmOutput || "";

        try {
            const jsonMatch = gOutput.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (!parsed.pass) {
                    result.pass = false;
                    result.issues.push(...(parsed.issues || []).map((i: string) => `[Grounding]: ${i}`));
                    await logger.log(`Grounding Failed: ${parsed.issues?.join('; ')}`, 'WARN');
                } else {
                    await logger.log(`Grounding Passed.`, 'DEBUG');
                }
            }
        } catch (e) {
            await logger.log(`Grounding Parse Error: ${e}`, 'WARN');
        }
    }

    if (result.pass) {
        await logger.log(`✅ Verification PASSED for ${filename}`);
        return { pass: true, issues: [] };
    } else {
        await logger.log(`❌ Verification FAILED for ${filename}`, 'WARN');
        for (const issue of result.issues) {
            await logger.log(`   - ${issue}`, 'WARN');
        }
        return { pass: false, issues: result.issues };
    }
}
