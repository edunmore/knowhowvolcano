/**
 * Core types for the Canon Extraction Pipeline
 */

// ============================================================
// Configuration
// ============================================================

export interface RunConfig {
    /** Starting chapter file path */
    startFile: string;
    /** Source directory containing markdown files */
    sourceDir: string;
    /** Canon directory */
    canonDir: string;
    /** Maximum chapters to select (default: 4) */
    maxFiles?: number;
    /** Maximum canon candidates to check (default: 3) */
    maxCandidates?: number;
    /** Quality thresholds */
    thresholds?: QualityThresholds;
    /** LLM provider to use */
    provider?: 'gemini' | 'deepseek' | 'ollama';
}

export interface QualityThresholds {
    faithfulness: number;       // default: 4/5
    generatorReadiness: number; // default: 4/5
    nonPlagiarism: number;      // default: 4/5
    maxAnchorIssues: number;    // default: 0
    maxNotInSource: number;     // default: 2
}

export const DEFAULT_THRESHOLDS: QualityThresholds = {
    faithfulness: 4,
    generatorReadiness: 4,
    nonPlagiarism: 4,
    maxAnchorIssues: 0,
    maxNotInSource: 2,
};

// ============================================================
// Source Store
// ============================================================

export interface ParagraphLocation {
    file: string;
    heading: string;
    paragraphIndex: number;
    lineStart?: number;
    lineEnd?: number;
}

export interface SourceDocument {
    path: string;
    content: string;
    paragraphs: ParagraphLocation[];
}

// ============================================================
// Router
// ============================================================

export type RouterMode = 'DISCOVER' | 'DELTA';

export interface RouterResult {
    mode: RouterMode;
    selectedFiles: string[];
    kernelSketch?: {
        topic: string;
        keyTerms: string[];
    };
    topCandidates: Array<{
        method_id: string;
        estimated_score: number;
    }>;
}

// ============================================================
// Extraction
// ============================================================

export interface AnchorSnippet {
    snippet: string;
    location: ParagraphLocation;
}

export interface TaggedClaim {
    text: string;
    tag: 'EXTRACTED' | 'INFERRED' | 'NOT_IN_SOURCE';
    anchors: AnchorSnippet[];
}

export interface MethodKernel {
    purpose: TaggedClaim[];
    preconditions: TaggedClaim[];
    roles: TaggedClaim[];
    process: TaggedClaim[];
    decisionRules: TaggedClaim[];
    successSignals: TaggedClaim[];
    failureModes: TaggedClaim[];
    dosDonts: TaggedClaim[];
}

export interface AuthorDeliveryModel {
    teachingStrategy: TaggedClaim[];
    persuasionMoves: TaggedClaim[];
    framingContrasts: TaggedClaim[];
    keyPhrases: string[];
    questionPatterns: TaggedClaim[];
}

export interface ReusePack {
    metaphors: string[];
    microScenarios: string[];
    storyBeats: string[];
    fableSpec: string;
}

export interface ExtractionDoc {
    methodKernel: MethodKernel;
    authorDeliveryModel: AuthorDeliveryModel;
    reusePack: ReusePack;
    qualityGateReport: string;
    rawMarkdown: string;
}

// ============================================================
// Critic
// ============================================================

export interface StressTestOutput {
    reelScript: string;
    fableOutline: string;
    comicBeats: string;
    gaps: string[];
}

export interface FaithfulnessAudit {
    anchorIssues: string[];
    unsupportedClaims: string[];
    overreachItems: string[];
    mislabelings: string[];
}

export interface Scorecard {
    operationalCompleteness: number;
    decisionRulesClarity: number;
    teachingTransfer: number;
    generatorReadiness: number;
    faithfulness: number;
    nonPlagiarismSafety: number;
}

export interface FixSpec {
    mustAdd: string[];
    mustRemove: string[];
    mustDowngrade: string[];
    mustProvideAnchors: string[];
    mustRewrite: string[];
    optional: string[];
}

export interface CriticReport {
    stressTest: StressTestOutput;
    audit: FaithfulnessAudit;
    scorecard: Scorecard;
    fixSpec: FixSpec;
    rawMarkdown: string;
}

// ============================================================
// Canon
// ============================================================

export interface CanonEntryMeta {
    method_id: string;
    title: string;
    aliases: string[];
    domain_tags: string[];
    created: string;
    last_updated: string;
    /** LLM provider used for extraction */
    provider?: string;
}

export interface CanonEntry extends CanonEntryMeta {
    content: string;
    filePath: string;
}

export interface CanonIndexEntry {
    method_id: string;
    title: string;
    aliases: string[];
    domain_tags: string[];
    kernel_fingerprint: {
        steps: string[];
        mechanism: string;
        primary_outcome: string;
    };
    signals: {
        canonical_questions: string[];
        decision_rules: string[];
    };
    source_span_hint: {
        typical_sources: string[];
        adjacent_dependency: string;
    };
    file: string;
}

export interface CanonIndex {
    version: number;
    updated: string;
    entries: CanonIndexEntry[];
}

export interface MatchResult {
    matched_method_id: string | null;
    confidence: number;
    rationale: string;
    merge_guidance?: string;
}

// ============================================================
// Run Outputs
// ============================================================

export interface RunOutput {
    runId: string;
    timestamp: string;
    config: RunConfig;
    /** LLM provider used */
    provider: string;
    routerResult: RouterResult;
    extraction?: ExtractionDoc;
    criticReport?: CriticReport;
    matchResult?: MatchResult;
    canonUpdate?: {
        action: 'new' | 'update';
        entryPath: string;
    };
    logs: string[];
}
