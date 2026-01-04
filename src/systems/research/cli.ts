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
  --provider <azure-gpt52|deepseek|ollama> (default: azure-gpt52)
  --vaultDir <dir>      (default: ./src/systems/research/vault)
  --runsDir <dir>       (default: ./runs)
  --verbose             Enable verbose logging
        `);
        return;
    }

    try {
        const vaultDir = resolve(getArg('vaultDir') || join(cwd, 'src/systems/research/vault'));
        const runsDir = resolve(getArg('runsDir') || join(cwd, 'runs'));

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
