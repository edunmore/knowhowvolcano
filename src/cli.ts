#!/usr/bin/env npx tsx
/**
 * Canon Pipeline CLI
 * 
 * Usage:
 *   npx tsx src/cli.ts run --start ./booksample/016_....md
 *   npx tsx src/cli.ts route --sourceDir ./booksample --start <file>
 *   npx tsx src/cli.ts extract --files <file1> <file2>
 */

import { resolve, dirname, basename, join } from 'node:path';
import { existsSync } from 'node:fs';

import { llmGeminiCLI } from './providers/gemini-cli-provider.js';
import { createDeepSeekWithTools } from './providers/deepseek-tools-provider.js';
import { createOllamaProvider } from './providers/ollama-provider.js';

import { runPipeline } from './pipeline/orchestrator.js';
import { routeChapters } from './pipeline/router.js';
import { extract } from './pipeline/extractor.js';
import { critique } from './pipeline/critic.js';
import { loadCanonIndex, matchCanon } from './pipeline/canon-matcher.js';
import { regenerateIndex } from './pipeline/canon-indexer.js';
import type { RunConfig } from './pipeline/types.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function getArg(name: string, defaultValue?: string): string | undefined {
    const index = args.indexOf(`--${name}`);
    if (index === -1) return defaultValue;
    return args[index + 1] || defaultValue;
}

function getProvider(providerName?: string) {
    switch (providerName) {
        case 'deepseek':
            console.log('Using DeepSeek V3.2 provider');
            return createDeepSeekWithTools();
        case 'ollama':
            console.log('Using Ollama qwen3:8b provider');
            return createOllamaProvider();
        case 'gemini':
        default:
            console.log('Using Gemini CLI provider');
            return llmGeminiCLI({ model: 'gemini-2.5-flash' });
    }
}

async function main() {
    console.log('\n=== Canon Extraction Pipeline ===\n');

    if (!command || command === 'help' || command === '--help') {
        console.log(`Usage:
  npx tsx src/cli.ts run --start <file> [options]
  npx tsx src/cli.ts route --sourceDir <dir> --start <file>
  npx tsx src/cli.ts extract --files <file1,file2,...>
  npx tsx src/cli.ts critic --extraction <file> --files <file1,file2,...>
  npx tsx src/cli.ts reindex --canonDir <dir>

Options:
  --provider <gemini|deepseek|ollama>  LLM provider (default: gemini)
  --sourceDir <dir>                     Source directory (default: ./booksample)
  --canonDir <dir>                      Canon directory (default: ./canon)
  --maxFiles <n>                        Max files to select (default: 4)
`);
        process.exit(0);
    }

    const provider = getArg('provider', 'gemini');
    const verbose = args.includes('--verbose');

    // Import and setup verbose logging if flag is set
    if (verbose) {
        const { setVerbose } = await import('./pipeline/verbose-logger.js');
        setVerbose(true);
    }

    let llm = getProvider(provider);

    // Wrap provider with verbose logging if enabled
    if (verbose) {
        const { wrapWithVerboseLogging } = await import('./pipeline/verbose-logger.js');
        llm = wrapWithVerboseLogging(llm, { cliArgs: args });
    }

    try {
        switch (command) {
            case 'run': {
                const startFile = getArg('start');
                if (!startFile) {
                    console.error('Error: --start <file> is required');
                    process.exit(1);
                }

                const sourceDir = resolve(getArg('sourceDir') || dirname(resolve(startFile)));
                // Canon directory defaults to {sourceDir}/canon
                const defaultCanonDir = join(sourceDir, 'canon');

                const config: RunConfig = {
                    startFile: resolve(startFile),
                    sourceDir,
                    canonDir: resolve(getArg('canonDir') || defaultCanonDir),
                    maxFiles: parseInt(getArg('maxFiles', '4')!, 10),
                    provider: provider as any,
                };

                console.log('Config:', config);
                if (verbose) console.log('Verbose mode: ON');
                console.log('');

                const result = await runPipeline(llm, config, verbose);

                console.log('\n=== Run Complete ===');
                console.log(`Run ID: ${result.runId}`);
                console.log(`Artifacts: ./runs/${result.runId}/`);
                if (result.canonUpdate) {
                    console.log(`Canon: ${result.canonUpdate.action} - ${result.canonUpdate.entryPath}`);
                }
                break;
            }

            case 'route': {
                const sourceDir = resolve(getArg('sourceDir', './booksample')!);
                const startFile = getArg('start');
                const canonDir = resolve(getArg('canonDir', './canon')!);

                if (!startFile) {
                    console.error('Error: --start <file> is required');
                    process.exit(1);
                }

                const canonIndex = loadCanonIndex(`${canonDir}/METHODS-CANON-INDEX.md`);
                const result = await routeChapters(llm, sourceDir, resolve(startFile), canonIndex);

                console.log('\nRouter Result:');
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'extract': {
                const filesArg = getArg('files');
                if (!filesArg) {
                    console.error('Error: --files <file1,file2,...> is required');
                    process.exit(1);
                }

                const files = filesArg.split(',').map(f => resolve(f.trim()));
                const result = await extract(llm, files);

                console.log('\nExtraction (raw markdown):');
                console.log(result.rawMarkdown);
                break;
            }

            case 'reindex': {
                const canonDir = resolve(getArg('canonDir', './canon')!);
                const indexPath = `${canonDir}/METHODS-CANON-INDEX.md`;

                const result = regenerateIndex(canonDir, indexPath);

                console.log('\nIndex regenerated:');
                console.log(`  Entries: ${result.entries.length}`);
                console.log(`  Output: ${indexPath}`);
                break;
            }

            case 'summarize': {
                // Import summarizer dynamically to avoid circular dependencies
                const { generateChapterSummaries } = await import('./pipeline/summarizer.js');

                const sourceDir = resolve(getArg('sourceDir', './booksample')!);
                const summaryProvider = getArg('summaryProvider', 'deepseek');
                const force = args.includes('--force');

                console.log(`Generating chapter summaries for: ${sourceDir}`);
                console.log(`Summary provider: ${summaryProvider}`);
                if (force) console.log('Force regeneration: yes');

                const summaryLlm = getProvider(summaryProvider);

                await generateChapterSummaries(summaryLlm, sourceDir, { force });

                console.log('\nSummaries saved to:');
                console.log(`  ${sourceDir}/canon/chaptersummary.md`);
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error: any) {
        console.error('\nError:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
