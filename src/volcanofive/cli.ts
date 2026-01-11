/**
 * volcanofive CLI
 * 
 * Entry point for MCP-based pipeline.
 */

import { runPipeline } from './orchestrator.js';
import { resolve } from 'node:path';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🌋 volcanofive - MCP Pipeline

Usage:
  npx tsx src/volcanofive/cli.ts <source> [--vault <path>]

Example:
  npx tsx src/volcanofive/cli.ts benchmark/benchmark_source_nohints.md --vault ./test-vault
`);
        process.exit(0);
    }

    const sourcePath = resolve(args[0]);
    let vaultDir = './vault-test';

    const vaultIdx = args.indexOf('--vault');
    if (vaultIdx !== -1 && args[vaultIdx + 1]) {
        vaultDir = resolve(args[vaultIdx + 1]);
    }

    await runPipeline(sourcePath, vaultDir);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
