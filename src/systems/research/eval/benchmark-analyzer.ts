import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';

/**
 * Expected item from benchmark_expected.json
 */
interface ExpectedItem {
    item_type: string;
    title: string;
}

/**
 * Benchmark expected structure
 */
interface BenchmarkExpected {
    schema_version: string;
    topic_id: string;
    items: ExpectedItem[];
    intended_inline_links?: string[];
    intended_link_candidates?: string[];
}

/**
 * Note from vault index
 */
interface IndexedNote {
    id: string;
    path: string;
    title: string;
    type: string;
}

/**
 * Match result for a single expected item
 */
interface ItemMatch {
    expected: ExpectedItem;
    matched_id: string | null;
    match_type: 'exact' | 'fuzzy' | 'none';
    confidence: number;
}

/**
 * Full benchmark analysis result
 */
export interface BenchmarkResult {
    run_id: string;
    benchmark_id: string;
    timestamp: string;
    source_file: string;
    vault_path: string;

    // Counts
    expected_count: number;
    actual_count: number;
    matched_count: number;
    missing_count: number;
    extra_count: number;

    // Metrics
    precision: number;  // matched / actual
    recall: number;     // matched / expected
    f1_score: number;

    // Detailed matches
    matches: ItemMatch[];

    // Extra items (in vault but not expected)
    extra_items: IndexedNote[];

    // Link analysis
    link_analysis?: {
        expected_inline: string[];
        expected_candidates: string[];
        found_inline: string[];
        found_candidates: string[];
    };
}

/**
 * Normalize text for matching
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/-/g, ' ')  // Convert hyphens to spaces first
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculate similarity between two strings (simple Jaccard on words)
 */
function similarity(a: string, b: string): number {
    const wordsA = new Set(normalize(a).split(' '));
    const wordsB = new Set(normalize(b).split(' '));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
}

/**
 * Load benchmark expected file
 */
async function loadExpected(benchmarkDir: string): Promise<BenchmarkExpected | null> {
    const expectedPath = join(benchmarkDir, 'benchmark_expected.json');

    try {
        const content = await fs.readFile(expectedPath, 'utf-8');
        return JSON.parse(content) as BenchmarkExpected;
    } catch {
        return null;
    }
}

/**
 * Load vault index
 */
async function loadVaultIndex(vaultDir: string): Promise<IndexedNote[]> {
    const indexPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.index, 'notes.json');

    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(content) as IndexedNote[];
    } catch {
        return [];
    }
}

/**
 * Extract ID suffix for display (e.g., "concept-outcome-ladder" -> "Outcome Ladder")
 */
function extractTitle(id: string): string {
    return id
        .replace(/^(concept|principle|procedure|misconception)-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Find best match for an expected item
 */
function findMatch(expected: ExpectedItem, notes: IndexedNote[]): ItemMatch {
    const normalizedExpected = normalize(expected.title);

    // Filter by type first
    const typeMap: Record<string, string> = {
        'concept': 'concept',
        'principle': 'principle',
        'procedure': 'procedure',
        'misconception': 'misconception',
        'example': 'example',
    };

    const targetType = typeMap[expected.item_type] || expected.item_type;
    const matchingType = notes.filter(n => n.type === targetType);

    // Try exact match on normalized title (same type)
    for (const note of matchingType) {
        const noteTitle = normalize(extractTitle(note.id));
        if (noteTitle === normalizedExpected) {
            return { expected, matched_id: note.id, match_type: 'exact', confidence: 1.0 };
        }
    }

    // Try fuzzy match (same type)
    let bestMatch: IndexedNote | null = null;
    let bestScore = 0;

    for (const note of matchingType) {
        const noteTitle = normalize(extractTitle(note.id));
        const score = similarity(noteTitle, normalizedExpected);

        if (score > bestScore && score > 0.5) {
            bestScore = score;
            bestMatch = note;
        }
    }

    if (bestMatch) {
        return { expected, matched_id: bestMatch.id, match_type: 'fuzzy', confidence: bestScore };
    }

    // Try cross-type matching (title matches but type is wrong)
    // This helps identify categorization issues
    const knowledgeTypes = ['concept', 'principle', 'procedure', 'misconception', 'example'];
    const otherTypeNotes = notes.filter(n =>
        knowledgeTypes.includes(n.type) && n.type !== targetType
    );

    for (const note of otherTypeNotes) {
        const noteTitle = normalize(extractTitle(note.id));
        if (noteTitle === normalizedExpected) {
            // Found same title but wrong type - still a match but with penalty
            return {
                expected,
                matched_id: note.id,
                match_type: 'fuzzy',  // Mark as fuzzy due to type mismatch 
                confidence: 0.6  // Lower confidence for type mismatch
            };
        }
    }

    // Try fuzzy cross-type match
    for (const note of otherTypeNotes) {
        const noteTitle = normalize(extractTitle(note.id));
        const score = similarity(noteTitle, normalizedExpected);

        if (score > 0.7) {  // Higher threshold for cross-type
            return {
                expected,
                matched_id: note.id,
                match_type: 'fuzzy',
                confidence: score * 0.7  // Penalty for type mismatch
            };
        }
    }

    // No match
    return { expected, matched_id: null, match_type: 'none', confidence: 0 };
}

/**
 * Parse link candidates from note content
 */
async function extractCandidatesFromNote(notePath: string): Promise<string[]> {
    try {
        const content = await fs.readFile(notePath, 'utf-8');
        const candidates: string[] = [];

        const sectionMatch = content.match(/## Link [Cc]andidates\n([\s\S]*?)(?=\n## |\n---|\Z)/);
        if (!sectionMatch) return candidates;

        const lines = sectionMatch[1].split('\n').filter(l => l.trim());
        for (const line of lines) {
            const match = line.match(/^-\s*(.+?)\s*\(/);
            if (match) {
                candidates.push(match[1].trim());
            }
        }

        return candidates;
    } catch {
        return [];
    }
}

/**
 * Run benchmark analysis
 */
export async function runBenchmarkAnalysis(
    benchmarkDir: string,
    vaultDir: string,
    sourceFile: string
): Promise<BenchmarkResult> {
    const expected = await loadExpected(benchmarkDir);
    const notes = await loadVaultIndex(vaultDir);

    if (!expected) {
        throw new Error(`No benchmark_expected.json found in ${benchmarkDir}`);
    }

    // Filter to knowledge notes only (exclude source_anchor, story)
    const knowledgeNotes = notes.filter(n =>
        ['concept', 'principle', 'procedure', 'misconception', 'example'].includes(n.type)
    );

    // Match each expected item
    const matches: ItemMatch[] = [];
    const matchedIds = new Set<string>();

    for (const item of expected.items) {
        const match = findMatch(item, knowledgeNotes);
        matches.push(match);
        if (match.matched_id) {
            matchedIds.add(match.matched_id);
        }
    }

    // Find extra items (created but not expected)
    const extraItems = knowledgeNotes.filter(n => !matchedIds.has(n.id));

    // Calculate metrics
    const matchedCount = matches.filter(m => m.matched_id !== null).length;
    const expectedCount = expected.items.length;
    const actualCount = knowledgeNotes.length;
    const missingCount = expectedCount - matchedCount;
    const extraCount = extraItems.length;

    const precision = actualCount > 0 ? matchedCount / actualCount : 0;
    const recall = expectedCount > 0 ? matchedCount / expectedCount : 0;
    const f1_score = precision + recall > 0
        ? 2 * (precision * recall) / (precision + recall)
        : 0;

    // Collect link candidates from all notes
    const allCandidates: string[] = [];
    for (const note of knowledgeNotes) {
        const notePath = resolveVaultPath(vaultDir, note.path);
        const candidates = await extractCandidatesFromNote(notePath);
        allCandidates.push(...candidates);
    }

    const result: BenchmarkResult = {
        run_id: `benchmark-${Date.now()}`,
        benchmark_id: expected.topic_id,
        timestamp: new Date().toISOString(),
        source_file: sourceFile,
        vault_path: vaultDir,

        expected_count: expectedCount,
        actual_count: actualCount,
        matched_count: matchedCount,
        missing_count: missingCount,
        extra_count: extraCount,

        precision: Math.round(precision * 100) / 100,
        recall: Math.round(recall * 100) / 100,
        f1_score: Math.round(f1_score * 100) / 100,

        matches,
        extra_items: extraItems,

        link_analysis: {
            expected_inline: expected.intended_inline_links || [],
            expected_candidates: expected.intended_link_candidates || [],
            found_inline: [], // Would need deeper parsing
            found_candidates: [...new Set(allCandidates)],
        },
    };

    return result;
}

/**
 * Format benchmark result as markdown report
 */
export function formatBenchmarkReport(result: BenchmarkResult): string {
    const lines: string[] = [];

    lines.push(`# Benchmark Analysis Report`);
    lines.push(``);
    lines.push(`**Run ID**: ${result.run_id}`);
    lines.push(`**Timestamp**: ${result.timestamp}`);
    lines.push(`**Source**: \`${result.source_file}\``);
    lines.push(`**Vault**: \`${result.vault_path}\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Summary Metrics`);
    lines.push(``);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Expected Items | ${result.expected_count} |`);
    lines.push(`| Actual Items | ${result.actual_count} |`);
    lines.push(`| Matched | ${result.matched_count} |`);
    lines.push(`| Missing | ${result.missing_count} |`);
    lines.push(`| Extra | ${result.extra_count} |`);
    lines.push(`| **Precision** | ${(result.precision * 100).toFixed(0)}% |`);
    lines.push(`| **Recall** | ${(result.recall * 100).toFixed(0)}% |`);
    lines.push(`| **F1 Score** | ${(result.f1_score * 100).toFixed(0)}% |`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Detailed Matches`);
    lines.push(``);
    lines.push(`| Expected | Type | Matched ID | Status |`);
    lines.push(`|----------|------|------------|--------|`);

    for (const match of result.matches) {
        const status = match.matched_id
            ? (match.match_type === 'exact' ? '✅' : `⚠️ ${(match.confidence * 100).toFixed(0)}%`)
            : '❌ Missing';
        lines.push(`| ${match.expected.title} | ${match.expected.item_type} | ${match.matched_id || '-'} | ${status} |`);
    }

    if (result.extra_items.length > 0) {
        lines.push(``);
        lines.push(`## Extra Items (not in expected)`);
        lines.push(``);
        for (const item of result.extra_items) {
            lines.push(`- \`${item.id}\` (${item.type})`);
        }
    }

    if (result.link_analysis) {
        lines.push(``);
        lines.push(`---`);
        lines.push(``);
        lines.push(`## Link Candidates Found`);
        lines.push(``);
        if (result.link_analysis.found_candidates.length > 0) {
            for (const c of result.link_analysis.found_candidates.slice(0, 20)) {
                lines.push(`- ${c}`);
            }
            if (result.link_analysis.found_candidates.length > 20) {
                lines.push(`- ... and ${result.link_analysis.found_candidates.length - 20} more`);
            }
        } else {
            lines.push(`(none found)`);
        }
    }

    lines.push(``);

    return lines.join('\n');
}

/**
 * Save benchmark result to history
 */
export async function saveBenchmarkResult(
    result: BenchmarkResult,
    benchmarkDir: string
): Promise<string> {
    // Save to benchmark history
    const historyDir = join(benchmarkDir, '_history');
    await fs.mkdir(historyDir, { recursive: true });

    const filename = `${result.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = join(historyDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2), 'utf-8');

    // Also save markdown report in vault
    const reportPath = join(result.vault_path, 'BENCHMARK_ANALYSIS.md');
    await fs.writeFile(reportPath, formatBenchmarkReport(result), 'utf-8');

    return filepath;
}

/**
 * Load benchmark history for comparison
 */
export async function loadBenchmarkHistory(benchmarkDir: string): Promise<BenchmarkResult[]> {
    const historyDir = join(benchmarkDir, '_history');

    try {
        const files = await fs.readdir(historyDir);
        const results: BenchmarkResult[] = [];

        for (const file of files.filter(f => f.endsWith('.json')).sort()) {
            const content = await fs.readFile(join(historyDir, file), 'utf-8');
            results.push(JSON.parse(content));
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * Generate comparison report across multiple runs
 */
export async function generateComparisonReport(benchmarkDir: string): Promise<string> {
    const history = await loadBenchmarkHistory(benchmarkDir);

    if (history.length === 0) {
        return '# No benchmark history found\n';
    }

    const lines: string[] = [];
    lines.push(`# Benchmark History Comparison`);
    lines.push(``);
    lines.push(`**Benchmark**: ${history[0].benchmark_id}`);
    lines.push(`**Total Runs**: ${history.length}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Progress Over Time`);
    lines.push(``);
    lines.push(`| Date | Recall | Precision | F1 | Notes |`);
    lines.push(`|------|--------|-----------|----|----|`);

    for (const run of history) {
        const date = run.timestamp.split('T')[0];
        const notes = run.matched_count === run.expected_count ? '✅ Perfect' : '';
        lines.push(`| ${date} | ${(run.recall * 100).toFixed(0)}% | ${(run.precision * 100).toFixed(0)}% | ${(run.f1_score * 100).toFixed(0)}% | ${notes} |`);
    }

    // Calculate improvement
    if (history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const recallDelta = ((last.recall - first.recall) * 100).toFixed(0);

        lines.push(``);
        lines.push(`**Recall Change**: ${recallDelta}% (from ${(first.recall * 100).toFixed(0)}% to ${(last.recall * 100).toFixed(0)}%)`);
    }

    return lines.join('\n');
}
