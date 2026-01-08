#!/usr/bin/env npx tsx
/**
 * Generate failure summary for self-learning analysis
 * 
 * Usage: npx tsx scripts/analyze-failures.ts <vault_dir>
 */

import { generateFailureSummary, loadAllFailures } from '../src/systems/research/utils/failure-log.js';
import fs from 'node:fs/promises';
import { join } from 'node:path';

const vaultDir = process.argv[2];

if (!vaultDir) {
    console.error('Usage: npx tsx scripts/analyze-failures.ts <vault_dir>');
    process.exit(1);
}

async function main() {
    console.log(`\n📋 Analyzing failures in: ${vaultDir}\n`);

    const failures = await loadAllFailures(vaultDir);

    if (failures.length === 0) {
        console.log('✅ No verification failures found!');
        console.log('   This is good - prompts are working well.');
        return;
    }

    console.log(`⚠️  Found ${failures.length} verification failures`);
    console.log('');

    // Group by type
    const byType: Record<string, number> = {};
    for (const f of failures) {
        byType[f.candidate_type] = (byType[f.candidate_type] || 0) + 1;
    }

    console.log('By type:');
    for (const [type, count] of Object.entries(byType)) {
        console.log(`   ${type}: ${count}`);
    }
    console.log('');

    // Common issues
    const issueCounts: Record<string, number> = {};
    for (const f of failures) {
        for (const issue of f.issues) {
            const category = issue.split(' ').slice(0, 4).join(' ') + '...';
            issueCounts[category] = (issueCounts[category] || 0) + 1;
        }
    }

    console.log('Top issues:');
    const sorted = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);
    for (const [issue, count] of sorted.slice(0, 5)) {
        console.log(`   (${count}x) ${issue}`);
    }
    console.log('');

    // Generate report
    const summary = await generateFailureSummary(vaultDir);
    const reportPath = join(vaultDir, 'FAILURE_ANALYSIS.md');
    await fs.writeFile(reportPath, summary);

    console.log(`📝 Full report saved to: ${reportPath}`);
    console.log('');
    console.log('💡 For self-learning: Review the failure patterns above.');
    console.log('   Improve prompts to reduce common failure types.');
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
