/**
 * Orchestrator - Subagent Pattern
 * 
 * Composes agents via .runAgent().
 * Volcano handles all logging automatically.
 */

import { agent } from 'volcano-sdk';
import { createIngestChunkAgent } from './agents/ingest-chunk.js';
import { createExtractAgent } from './agents/extract.js';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Run the full pipeline
 */
export async function runPipeline(sourcePath: string, vaultDir: string) {
    // Ensure vault structure
    await fs.mkdir(join(vaultDir, '_sources'), { recursive: true });

    // Compose agents
    return await agent({ name: 'pipeline' })
        .runAgent(createIngestChunkAgent(sourcePath, vaultDir))
        .runAgent(createExtractAgent(vaultDir))
        .run();
}
