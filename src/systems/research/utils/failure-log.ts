import fs from 'node:fs/promises';
import { join } from 'node:path';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';

/**
 * Verification failure record for self-learning
 */
export interface VerificationFailure {
    timestamp: string;
    run_id?: string;

    // What failed
    candidate_name: string;
    candidate_type: string;
    step: 'modeling' | 'verification' | 'grounding';

    // The content
    source_context: string;      // Source text that was used
    generated_content: string;   // What the LLM generated

    // Why it failed
    issues: string[];            // List of issues from verifier

    // For analysis
    prompt_used?: string;        // Which prompt file
    model_used?: string;         // Which LLM
}

/**
 * Log a verification failure for future self-learning analysis
 */
export async function logVerificationFailure(
    vaultDir: string,
    failure: VerificationFailure
): Promise<string> {
    const failuresDir = resolveVaultPath(vaultDir, '_system', 'failures');
    await fs.mkdir(failuresDir, { recursive: true });

    // Create filename from timestamp and candidate
    const slug = failure.candidate_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30);
    const timestamp = failure.timestamp.replace(/[:.]/g, '-');
    const filename = `${timestamp}-${failure.candidate_type}-${slug}.json`;

    const filepath = join(failuresDir, filename);
    await fs.writeFile(filepath, JSON.stringify(failure, null, 2), 'utf-8');

    return filepath;
}

/**
 * Load all failures for analysis
 */
export async function loadAllFailures(vaultDir: string): Promise<VerificationFailure[]> {
    const failuresDir = resolveVaultPath(vaultDir, '_system', 'failures');

    try {
        const files = await fs.readdir(failuresDir);
        const failures: VerificationFailure[] = [];

        for (const file of files.filter(f => f.endsWith('.json'))) {
            const content = await fs.readFile(join(failuresDir, file), 'utf-8');
            failures.push(JSON.parse(content));
        }

        return failures;
    } catch {
        return [];
    }
}

/**
 * Generate a summary of failures for self-learning analysis
 */
export async function generateFailureSummary(vaultDir: string): Promise<string> {
    const failures = await loadAllFailures(vaultDir);

    if (failures.length === 0) {
        return '# Verification Failures\n\nNo failures recorded.\n';
    }

    const lines: string[] = [];
    lines.push('# Verification Failures - Self-Learning Data');
    lines.push('');
    lines.push(`**Total Failures**: ${failures.length}`);
    lines.push(`**Generated**: ${new Date().toISOString()}`);
    lines.push('');

    // Group by type
    const byType: Record<string, VerificationFailure[]> = {};
    for (const f of failures) {
        if (!byType[f.candidate_type]) byType[f.candidate_type] = [];
        byType[f.candidate_type].push(f);
    }

    lines.push('## By Type');
    for (const [type, typeFailures] of Object.entries(byType)) {
        lines.push(`- **${type}**: ${typeFailures.length} failures`);
    }
    lines.push('');

    // Common issues
    const issueCounts: Record<string, number> = {};
    for (const f of failures) {
        for (const issue of f.issues) {
            // Categorize issues by first few words
            const category = issue.split(' ').slice(0, 5).join(' ') + '...';
            issueCounts[category] = (issueCounts[category] || 0) + 1;
        }
    }

    lines.push('## Common Issue Patterns');
    const sortedIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);
    for (const [issue, count] of sortedIssues.slice(0, 10)) {
        lines.push(`- (${count}x) ${issue}`);
    }
    lines.push('');

    lines.push('## Detailed Failures');
    lines.push('');
    for (const f of failures.slice(0, 20)) {  // Show first 20
        lines.push(`### ${f.candidate_name} (${f.candidate_type})`);
        lines.push(`- **Step**: ${f.step}`);
        lines.push(`- **Time**: ${f.timestamp}`);
        lines.push(`- **Issues**:`);
        for (const issue of f.issues) {
            lines.push(`  - ${issue.slice(0, 200)}${issue.length > 200 ? '...' : ''}`);
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## For Self-Learning Agent');
    lines.push('');
    lines.push('When implementing prompt improvement:');
    lines.push('1. Load failures from `_system/failures/*.json`');
    lines.push('2. Analyze common issue patterns');
    lines.push('3. Compare source_context vs generated_content');
    lines.push('4. Modify the relevant prompt file');
    lines.push('5. Re-run extraction and measure improvement');
    lines.push('');

    return lines.join('\n');
}
