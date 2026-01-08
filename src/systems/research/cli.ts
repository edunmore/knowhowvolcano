import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import { runResearchPipeline } from './orchestrator.js';
import { runRunbook, registerStepExecutor } from './runbook-runner.js';
import { runAutonomousCoordinator, type RunbookGoals } from './autonomous-coordinator.js';
import './step-executors.js';  // Register all step executors
import { RunLogger } from './run-logger.js';
import { createAzureGPT52Provider } from '../../core/providers/azure-gpt52-provider.js';
import { createAzureProvider } from '../../core/providers/azure-deepseek-provider.js';
import { createOllamaProvider } from '../../core/providers/ollama-provider.js';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';
import type { ResearchConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getArg(name: string): string | undefined {
    const index = process.argv.indexOf(`--${name}`);
    if (index !== -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }
    return undefined;
}

function hasArg(name: string): boolean {
    return process.argv.includes(`--${name}`);
}

function getProvider(providerName: string) {
    switch (providerName) {
        case 'azure-gpt52': return createAzureGPT52Provider();
        case 'deepseek': return createAzureProvider();
        case 'ollama': return createOllamaProvider();
        default: return createAzureGPT52Provider();
    }
}

async function main() {
    const command = process.argv[2];
    const cwd = process.cwd();

    const providerArg = getArg('provider');
    const provider = (providerArg === 'azure-gpt52' || providerArg === 'deepseek')
        ? providerArg
        : 'deepseek';  // Default to deepseek for orchestrator decisions

    if (!command || hasArg('help')) {
        console.log(`
Usage:
  npx tsx src/systems/research/cli.ts <command> [options]

Commands:
  coordinate --runbook <id>    🤖 AUTONOMOUS: AI coordinator decides next steps
  run --runbook <id>           Run a deterministic runbook workflow  
  ingest --file <file>         Ingest a single file (legacy hardcoded pipeline)

Options:
  --vault <path>               Vault directory (default: ./vault)
  --file <file>                Input file to process
  --verbose                    Enable verbose logging

Examples:
  # Autonomous coordinator (recommended)
  npx tsx src/systems/research/cli.ts coordinate \\
    --runbook knowledge-extraction \\
    --file ./booksample/006_1_what_is_coaching.md \\
    --vault ./test-vault

  # Deterministic runbook (for testing)
  npx tsx src/systems/research/cli.ts run \\
    --runbook chunk-only \\
    --file ./booksample/006_1.md \\
    --vault ./test-vault
        `);
        return;
    }

    try {
        // Vault path is the primary configuration point
        const vaultDir = resolve(getArg('vault') || join(cwd, 'vault'));

        // runsDir defaults to inside vault, but can be overridden
        const runsDir = resolve(getArg('runsDir') || join(vaultDir, '_runs'));

        if (command === 'coordinate') {
            // 🤖 AUTONOMOUS COORDINATOR - AI decides next steps
            const runbookId = getArg('runbook');
            const inputFile = getArg('file');

            if (!runbookId) {
                console.error('Error: --runbook <id> is required');
                process.exit(1);
            }
            if (!inputFile) {
                console.error('Error: --file <file> is required');
                process.exit(1);
            }

            // Load runbook (goals format)
            const runbookPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.runbooks, `${runbookId}.yml`);
            let runbook: RunbookGoals;
            try {
                const content = await fs.readFile(runbookPath, 'utf-8');
                runbook = yaml.load(content) as RunbookGoals;
            } catch {
                console.error(`Error: Runbook not found: ${runbookPath}`);
                process.exit(1);
            }

            // Create logger
            const logger = await RunLogger.create(runsDir, hasArg('verbose'));

            console.log(`🤖 Autonomous Coordinator`);
            console.log(`   Runbook: ${runbook.runbook_id} v${runbook.version}`);
            console.log(`   Goals: ${runbook.goals?.length || 0}`);
            console.log(`   File: ${inputFile}`);
            console.log(`   Vault: ${vaultDir}`);
            console.log(`\n   Starting... (this may take a while)\n`);

            const result = await runAutonomousCoordinator(
                runbook,
                vaultDir,
                resolve(inputFile),
                logger
            );

            console.log(`\n🏁 Run Complete: ${result.status}`);
            console.log(`   Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);
            console.log(`   Notes created: ${result.notesCreated.length}`);
            if (result.issues.length > 0) {
                console.log(`   Issues: ${result.issues.join(', ')}`);
            }
            if (result.improvements && result.improvements.length > 0) {
                console.log(`\n   💡 Suggested improvements:`);
                result.improvements.forEach(imp => console.log(`      - ${imp}`));
            }
            console.log(`\n   Full results: ${vaultDir}/_runs/coordinator/${result.runId}/`);

        } else if (command === 'run') {
            // Runbook-based execution
            const runbookId = getArg('runbook');
            if (!runbookId) {
                console.error('Error: --runbook <id> is required for run command');
                process.exit(1);
            }

            // Collect inputs from CLI
            const inputs: Record<string, any> = {};
            if (getArg('file')) inputs.file = resolve(getArg('file')!);
            if (getArg('dir')) inputs.dir = resolve(getArg('dir')!);
            if (getArg('chunk-size')) inputs.chunkSize = parseInt(getArg('chunk-size')!);
            if (getArg('min-chunk')) inputs.minChunk = parseInt(getArg('min-chunk')!);
            inputs.vaultDir = vaultDir;

            // Create logger
            const logger = await RunLogger.create(runsDir, hasArg('verbose'));

            // Get LLM for orchestrator decisions
            const llm = getProvider(provider);

            console.log(`Running runbook: ${runbookId}`);
            console.log(`  Vault: ${vaultDir}`);
            console.log(`  Provider: ${provider}`);

            // CRITICAL: Ensure vault exists and has templates BEFORE loading runbook
            const { ensureVaultLayout } = await import('./utils/vault-utils.js');
            await ensureVaultLayout(vaultDir);

            const result = await runRunbook(runbookId, vaultDir, llm, inputs, logger);

            console.log(`\nRunbook completed: ${result.status}`);
            console.log(`  Steps: ${result.steps_completed}/${result.steps_total}`);
            console.log(`  Decisions: ${result.decisions.length}`);
            if (result.decisions.length > 0) {
                console.log(`  Decision log:`);
                for (const d of result.decisions) {
                    console.log(`    - ${d.decision_point}: ${d.value}`);
                }
            }
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            }

        } else if (command === 'ingest') {
            // Legacy hardcoded pipeline
            const config: ResearchConfig = {
                sourceDir: cwd,
                vaultDir,
                runsDir,
                provider: provider,
                verbose: hasArg('verbose')
            };

            const startFile = getArg('file');
            if (!startFile) {
                console.error('Error: --file <file> is required for ingestion');
                process.exit(1);
            }
            config.startFile = resolve(startFile);

            console.log(`Starting ingestion with vault: ${vaultDir}`);
            await runResearchPipeline(config);

        } else {
            console.error(`Unknown command: ${command}`);
            process.exit(1);
        }

    } catch (error: any) {
        console.error('An error occurred:', error.message);
        if (hasArg('verbose')) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
