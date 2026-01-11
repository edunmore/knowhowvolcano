#!/usr/bin/env npx tsx
/**
 * Benchmark analyzer CLI script
 * 
 * Usage: npx tsx scripts/analyze-benchmark.ts <benchmark_dir> <vault_dir>
 */

import {
    runBenchmarkAnalysis,
    formatBenchmarkReport,
    saveBenchmarkResult,
    generateComparisonReport,
} from '../src/systems/research/eval/benchmark-analyzer.js';

const benchmarkDir = process.argv[2];
const vaultDir = process.argv[3];

if (!benchmarkDir || !vaultDir) {
    console.error('Usage: npx tsx scripts/analyze-benchmark.ts <benchmark_dir> <vault_dir>');
    console.error('Example: npx tsx scripts/analyze-benchmark.ts ./benchmark ./benchmark/vault-2026-01-05');
    process.exit(1);
}

async function main() {
    console.log(`\n🔬 Benchmark Analysis\n`);
    console.log(`Benchmark: ${benchmarkDir}`);
    console.log(`Vault: ${vaultDir}`);
    console.log('');

    try {
        // Find source file
        const sourceFile = `${benchmarkDir}/benchmark_source_raw.md`;

        const result = await runBenchmarkAnalysis(benchmarkDir, vaultDir, sourceFile);

        console.log(`📊 Results:\n`);
        console.log(`   Expected Items: ${result.expected_count}`);
        console.log(`   Actual Items:   ${result.actual_count}`);
        console.log(`   Matched:        ${result.matched_count}`);
        console.log(`   Missing:        ${result.missing_count}`);
        console.log(`   Extra:          ${result.extra_count}`);
        console.log('');
        console.log(`   Precision: ${(result.precision * 100).toFixed(0)}%`);
        console.log(`   Recall:    ${(result.recall * 100).toFixed(0)}%`);
        console.log(`   F1 Score:  ${(result.f1_score * 100).toFixed(0)}%`);
        console.log('');

        // Save result
        const historyPath = await saveBenchmarkResult(result, benchmarkDir);
        console.log(`💾 Saved to history: ${historyPath}`);
        console.log(`📝 Report saved to: ${vaultDir}/BENCHMARK_ANALYSIS.md`);

        // Show comparison if history exists
        const comparison = await generateComparisonReport(benchmarkDir);
        if (comparison.includes('| Date |')) {
            console.log(`\n📈 History Comparison:`);
            console.log(comparison.split('---')[1] || '');
        }

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

main();
