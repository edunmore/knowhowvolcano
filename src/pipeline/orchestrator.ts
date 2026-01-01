/**
 * Orchestrator - Main pipeline coordination
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { LLMHandle } from 'volcano-sdk';
import type { RunConfig, RunOutput, DEFAULT_THRESHOLDS } from './types.js';
import { routeChapters } from './router.js';
import { extract } from './extractor.js';
import { critique, meetsThresholds } from './critic.js';
import { loadCanonIndex, matchCanon, loadCanonEntry } from './canon-matcher.js';
import { applyCanonUpdate } from './canon-updater.js';
import { regenerateIndex } from './canon-indexer.js';

/**
 * Generate a run ID
 */
function generateRunId(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Log a message to the run log
 */
function log(logs: string[], message: string): void {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
    console.log(message);
}

/**
 * Run the full extraction pipeline
 */
export async function runPipeline(
    llm: LLMHandle,
    config: RunConfig
): Promise<RunOutput> {
    const runId = generateRunId();
    const logs: string[] = [];

    // Create run directory
    const runDir = join('./runs', runId);
    mkdirSync(runDir, { recursive: true });

    log(logs, `=== Starting Pipeline Run: ${runId} ===`);
    log(logs, `Start file: ${config.startFile}`);
    log(logs, `Provider: ${llm.id}`);

    // Initialize output
    const output: RunOutput = {
        runId,
        timestamp: new Date().toISOString(),
        config,
        provider: llm.id,
        routerResult: { mode: 'DISCOVER', selectedFiles: [], topCandidates: [] },
        logs,
    };

    try {
        // Step 1: Route chapters
        log(logs, '\n--- Step 1: Router ---');
        const canonIndexPath = join(config.canonDir, 'METHODS-CANON-INDEX.md');
        const canonIndex = loadCanonIndex(canonIndexPath);

        const routerResult = await routeChapters(
            llm,
            config.sourceDir,
            config.startFile,
            canonIndex,
            config.maxFiles || 4
        );
        output.routerResult = routerResult;

        log(logs, `Mode: ${routerResult.mode}`);
        log(logs, `Selected files: ${routerResult.selectedFiles.length}`);
        routerResult.selectedFiles.forEach(f => log(logs, `  - ${f}`));

        // Save router output
        writeFileSync(
            join(runDir, 'router-result.json'),
            JSON.stringify(routerResult, null, 2)
        );

        // Step 2: Extract
        log(logs, '\n--- Step 2: Extraction ---');
        const extraction = await extract(llm, routerResult.selectedFiles);
        output.extraction = extraction;

        log(logs, `Extraction complete: ${extraction.rawMarkdown.length} chars`);

        // Save extraction
        writeFileSync(join(runDir, 'extraction.md'), extraction.rawMarkdown);

        // Step 3: Critic
        log(logs, '\n--- Step 3: Critic ---');
        const criticReport = await critique(llm, extraction, routerResult.selectedFiles);
        output.criticReport = criticReport;

        log(logs, `Scorecard:`);
        log(logs, `  - Faithfulness: ${criticReport.scorecard.faithfulness}/5`);
        log(logs, `  - Generator Readiness: ${criticReport.scorecard.generatorReadiness}/5`);
        log(logs, `  - Non-plagiarism: ${criticReport.scorecard.nonPlagiarismSafety}/5`);

        // Save critic report
        writeFileSync(join(runDir, 'critic.md'), criticReport.rawMarkdown);
        writeFileSync(
            join(runDir, 'scorecard.json'),
            JSON.stringify(criticReport.scorecard, null, 2)
        );

        // Step 4: Match against canon
        log(logs, '\n--- Step 4: Canon Matching ---');
        const matchResult = await matchCanon(
            llm,
            extraction,
            canonIndex,
            config.canonDir,
            config.maxCandidates || 3
        );
        output.matchResult = matchResult;

        log(logs, `Match result: ${matchResult.matched_method_id || 'NEW METHOD'}`);
        log(logs, `Confidence: ${matchResult.confidence}%`);

        // Save match result
        writeFileSync(
            join(runDir, 'match.json'),
            JSON.stringify(matchResult, null, 2)
        );

        // Step 5: Update canon
        log(logs, '\n--- Step 5: Canon Update ---');
        let existingEntry = undefined;
        if (matchResult.matched_method_id) {
            const entryPath = join(config.canonDir, 'methods', `${matchResult.matched_method_id}.md`);
            existingEntry = loadCanonEntry(entryPath) || undefined;
        }

        const canonUpdate = applyCanonUpdate(
            extraction,
            matchResult,
            config.canonDir,
            existingEntry,
            llm.id,
            { startFile: config.startFile, selectedFiles: routerResult.selectedFiles }
        );
        output.canonUpdate = canonUpdate;

        log(logs, `Action: ${canonUpdate.action}`);
        log(logs, `Entry: ${canonUpdate.entryPath}`);

        // Step 6: Regenerate index
        log(logs, '\n--- Step 6: Regenerate Index ---');
        regenerateIndex(config.canonDir, canonIndexPath);
        log(logs, `Index regenerated: ${canonIndexPath}`);

        // Finalize
        log(logs, '\n=== Pipeline Complete ===');
        log(logs, `Run artifacts saved to: ${runDir}`);

    } catch (error: any) {
        log(logs, `\n!!! ERROR: ${error.message}`);
        throw error;
    } finally {
        // Save logs
        writeFileSync(join(runDir, 'run.log'), logs.join('\n'));
        writeFileSync(
            join(runDir, 'output.json'),
            JSON.stringify(output, null, 2)
        );
    }

    return output;
}
