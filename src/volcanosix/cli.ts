/**
 * CLI for volcanosix
 */

import { runPipeline } from './orchestrator.js';
import { resolve } from 'node:path';

const sourcePath = process.argv[2];
const vaultArg = process.argv.indexOf('--vault');
const vaultDir = vaultArg !== -1 ? process.argv[vaultArg + 1] : './vault';

if (!sourcePath) {
    console.error('Usage: npx tsx src/volcanosix/cli.ts <source-file> [--vault <vault-dir>]');
    process.exit(1);
}

await runPipeline(resolve(sourcePath), resolve(vaultDir));
