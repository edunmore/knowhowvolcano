import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { join, basename } from 'node:path';
import fs from 'node:fs/promises';
import { RunLogger } from '../run-logger.js';

export async function runIngestor(
    llm: LLMHandle,
    filePath: string,
    vaultDir: string,
    logger: RunLogger
) {
    await logger.log(`Starting Ingestor for: ${filePath}`);

    const fileName = basename(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const preview = content.slice(0, 2000); // 2k chars preview for metadata extraction

    // source_anchor folder
    const sourcesDir = join(vaultDir, 'sources');
    await fs.mkdir(sourcesDir, { recursive: true });

    // 1. Agent Step: Extract Metadata to create source_anchor
    const promptPath = join(vaultDir, '_system', 'prompts', 'prompt-ingest.md');
    // We need renderPrompt import. 
    // Assuming prompt-renderer is available in ../prompt-renderer.js
    const { renderPrompt } = await import('../prompt-renderer.js');

    const prompt = await renderPrompt(promptPath, {
        file_name: fileName,
        content_preview: preview
    });

    await logger.log(`[prompt-ingest.md]:\n${prompt}`, 'DEBUG');

    const result = await agent({ llm, name: 'Ingestor' })
        .then({ prompt })
        .run();

    const yaml = result[0]?.llmOutput?.trim() || '';

    // Naive parsing/cleaning if LLM wraps in code blocks
    let cleanYaml = yaml.replace(/^```yaml\n/, '').replace(/\n```$/, '');

    // Extract ID to use as filename
    const idMatch = cleanYaml.match(/id:\s*([a-z0-9-_]+)/);
    const sourceId = idMatch ? idMatch[1] : `source-${Date.now()}`;
    const outputName = `${sourceId}.md`;
    const outputPath = join(sourcesDir, outputName);

    // Write the source anchor note
    // Clean existing delimiters to avoid duplication
    cleanYaml = cleanYaml.replace(/^---\n/, '').replace(/\n---$/, '').trim();

    // Write the source anchor note
    const noteContent = `---\n${cleanYaml}\n---\n\n# ${fileName}\n\n[Original File](${filePath})\n\n(Full text content was ingested from ${filePath})`;

    await fs.writeFile(outputPath, noteContent);
    await logger.log(`Created source anchor: ${outputPath}`);

    return {
        sourceId,
        sourcePath: outputPath
    };
}
