#!/usr/bin/env node
/**
 * Validate Runbook CLI
 * 
 * Validates runbook YAML files against schema and checks references.
 */

import { validateRunbook } from './runbook-validator.js';
import { resolve } from 'node:path';

async function main() {
    const runbookPath = process.argv[2];
    const vaultDir = process.argv[3];

    if (!runbookPath) {
        console.error('Usage: npx tsx validate-runbook.ts <runbook-yaml> [vault-dir]');
        console.error('');
        console.error('Examples:');
        console.error('  npx tsx validate-runbook.ts ./vault/_system/runbooks/knowledge-extraction-v2.yml');
        console.error('  npx tsx validate-runbook.ts ./vault/_system/runbooks/knowledge-extraction-v2.yml ./vault');
        process.exit(1);
    }

    console.log('📋 Runbook Validator\n');
    console.log(`   Runbook: ${runbookPath}`);
    if (vaultDir) {
        console.log(`   Vault: ${vaultDir}`);
    }
    console.log('');

    try {
        const result = await validateRunbook(
            resolve(runbookPath),
            vaultDir ? resolve(vaultDir) : undefined
        );

        if (result.valid) {
            console.log('✅ Runbook is valid!\n');

            if (result.warnings.length > 0) {
                console.log('⚠️  Warnings:');
                for (const warning of result.warnings) {
                    console.log(`   - ${warning}`);
                }
                console.log('');
            }
        } else {
            console.log('❌ Runbook validation failed!\n');
            console.log('Errors:');
            for (const error of result.errors) {
                console.log(`   - ${error}`);
            }
            console.log('');

            if (result.warnings.length > 0) {
                console.log('Warnings:');
                for (const warning of result.warnings) {
                    console.log(`   - ${warning}`);
                }
                console.log('');
            }

            process.exit(1);
        }

    } catch (error) {
        console.error('Error validating runbook:', error);
        process.exit(1);
    }
}

main();
