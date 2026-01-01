/**
 * Critic - Run downstream stress test and faithfulness audit
 * 
 * Uses file-reference prompts - the LLM reads source files directly.
 * All prompts loaded from PROMPTS folder - no hardcoded prompts.
 */

import { resolve } from 'node:path';
import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { CriticReport, ExtractionDoc } from './types.js';
import { loadPromptWithValues } from './prompt-loader.js';

/**
 * Parse scorecard from critic output
 */
function parseScorecard(output: string): CriticReport['scorecard'] {
    const defaultScore = 3; // Default middle score

    const extractScore = (label: string): number => {
        const regex = new RegExp(`${label}[:\\s]*(\\d)`, 'i');
        const match = output.match(regex);
        return match ? parseInt(match[1], 10) : defaultScore;
    };

    return {
        operationalCompleteness: extractScore('operational completeness'),
        decisionRulesClarity: extractScore('decision rules clarity'),
        teachingTransfer: extractScore('teaching transfer'),
        generatorReadiness: extractScore('generator readiness'),
        faithfulness: extractScore('faithfulness'),
        nonPlagiarismSafety: extractScore('non-?plagiarism safety'),
    };
}

/**
 * Parse fix spec from critic output
 */
function parseFixSpec(output: string): CriticReport['fixSpec'] {
    const extractList = (header: string): string[] => {
        const regex = new RegExp(`${header}[:\\s]*([\\s\\S]*?)(?=MUST|OPTIONAL|$)`, 'i');
        const match = output.match(regex);
        if (!match) return [];

        return match[1]
            .split('\n')
            .map(line => line.replace(/^[-*]\s*/, '').trim())
            .filter(line => line.length > 0);
    };

    return {
        mustAdd: extractList('MUST ADD'),
        mustRemove: extractList('MUST REMOVE'),
        mustDowngrade: extractList('MUST DOWNGRADE'),
        mustProvideAnchors: extractList('MUST PROVIDE ANCHORS'),
        mustRewrite: extractList('MUST REWRITE'),
        optional: extractList('OPTIONAL'),
    };
}

/**
 * Run the critic evaluation
 * Note: The LLM reads source files directly using its file-reading capability
 */
export async function critique(
    llm: LLMHandle,
    extraction: ExtractionDoc,
    selectedFiles: string[]
): Promise<CriticReport> {
    // Build file reference list with absolute paths
    const fileList = selectedFiles
        .map((p, i) => `${i + 1}. ${resolve(p)}`)
        .join('\n');

    // Load prompt from external file - NO hardcoded prompts
    const prompt = loadPromptWithValues('DOWNSTREAM_CRITIC', {
        sourceFiles: `Please read these source files:\n${fileList}`,
        extraction: extraction.rawMarkdown,
    });

    // Run critic - LLM reads files via its tools
    const results = await agent({ llm })
        .then({ prompt })
        .run();

    const rawMarkdown = results[0]?.llmOutput || '';

    // Parse outputs
    const scorecard = parseScorecard(rawMarkdown);
    const fixSpec = parseFixSpec(rawMarkdown);

    return {
        stressTest: {
            reelScript: '',
            fableOutline: '',
            comicBeats: '',
            gaps: [],
        },
        audit: {
            anchorIssues: [],
            unsupportedClaims: [],
            overreachItems: [],
            mislabelings: [],
        },
        scorecard,
        fixSpec,
        rawMarkdown,
    };
}

/**
 * Check if scores meet thresholds
 */
export function meetsThresholds(
    scorecard: CriticReport['scorecard'],
    thresholds: { faithfulness: number; generatorReadiness: number; nonPlagiarism: number }
): boolean {
    return (
        scorecard.faithfulness >= thresholds.faithfulness &&
        scorecard.generatorReadiness >= thresholds.generatorReadiness &&
        scorecard.nonPlagiarismSafety >= thresholds.nonPlagiarism
    );
}
