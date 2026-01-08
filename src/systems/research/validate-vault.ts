#!/usr/bin/env npx tsx
/**
 * CLI to validate a vault against Phase 1 requirements
 */

import { validateVault } from './__tests__/phase1-validation.test.js';
import { resolve } from 'node:path';

async function main() {
    const vaultPath = process.argv[2] || './benchmark/uat-phase1';
    const resolvedPath = resolve(vaultPath);

    console.log(`\n=== Phase 1 Vault Validation ===`);
    console.log(`Vault: ${resolvedPath}\n`);

    const result = await validateVault(resolvedPath);

    console.log(`Total notes: ${result.total}`);
    console.log(`Valid: ${result.valid} ✅`);
    console.log(`Invalid: ${result.invalid} ❌`);
    console.log(`\n--- Details ---\n`);

    for (const r of result.results) {
        const status = r.valid ? '✅' : '❌';
        console.log(`${status} ${r.file}`);
        if (r.errors.length > 0) {
            for (const e of r.errors) {
                console.log(`   ERROR: ${e}`);
            }
        }
        if (r.warnings.length > 0) {
            for (const w of r.warnings) {
                console.log(`   WARN: ${w}`);
            }
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Pass rate: ${((result.valid / result.total) * 100).toFixed(1)}%`);

    process.exit(result.invalid > 0 ? 1 : 0);
}

main().catch(console.error);
