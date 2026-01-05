import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { runResearchPipeline } from './orchestrator.js';
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

async function main() {
    const command = process.argv[2];
    const cwd = process.cwd();

    const providerArg = getArg('provider');
    const provider = (providerArg === 'azure-gpt52' || providerArg === 'deepseek' || providerArg === 'ollama')
        ? providerArg
        : 'azure-gpt52';

    if (!command || hasArg('help')) {
        console.log(`
Usage:
  npx tsx src/systems/research/cli.ts <command> [options]

Commands:
  ingest --file <file>   Ingest a single file into the vault

Options:
  --vault <path>          Vault directory (default: ./vault)
  --provider <provider>   azure-gpt52|deepseek|ollama (default: azure-gpt52)
  --runsDir <dir>         Runs output dir (default: <vault>/_runs)
  --verbose               Enable verbose logging

Examples:
  # Ingest a file into a domain-specific vault
  npx tsx src/systems/research/cli.ts ingest \\
    --file ./booksample/chapter01.md \\
    --vault ./vaults/coaching \\
    --provider deepseek
        `);
        return;
    }

    try {
        // Vault path is the primary configuration point
        const vaultDir = resolve(getArg('vault') || join(cwd, 'vault'));

        // runsDir defaults to inside vault, but can be overridden
        const runsDir = resolve(getArg('runsDir') || join(vaultDir, '_runs'));

        const config: ResearchConfig = {
            sourceDir: cwd, // not strictly used for single file ingest yet
            vaultDir,
            runsDir,
            provider: provider,
            verbose: hasArg('verbose')
        };

        if (command === 'ingest') {
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
        process.exit(1);
    }
}

main();

