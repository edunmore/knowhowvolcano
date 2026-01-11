import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from '../utils/vault-utils.js';
import {
    exactJsonMatch,
    setOverlap,
    markdownStructure,
    schemaJson,
    hybridCompare,
    type ComparisonResult
} from './comparators.js';

/**
 * Step types for scenarios
 */
export type StepType = 'gate' | 'extract_candidates' | 'resolve' | 'model_note' | 'generate_story' | 'extract_nkm';

/**
 * Step scenario definition (from schema)
 */
export interface StepScenario {
    scenario_id: string;
    step: StepType;
    description?: string;
    inputs: {
        files?: string[];
        inline?: Record<string, any>;
    };
    expected: {
        files?: string[];
        inline?: Record<string, any>;
    };
    compare: {
        method: 'exact_json' | 'schema_json' | 'set_overlap' | 'markdown_structure' | 'hybrid';
        thresholds?: Record<string, number>;
    };
    models?: Record<string, string>;
    notes?: string[];
}

/**
 * Scenario run result
 */
export interface ScenarioRunResult {
    scenario_id: string;
    step: StepType;
    pass: boolean;
    comparison: ComparisonResult;
    actual_output: any;
    expected_output: any;
    duration_ms: number;
    error?: string;
}

/**
 * Scenario report
 */
export interface ScenarioReport {
    run_id: string;
    step: StepType;
    timestamp: string;
    scenarios_run: number;
    scenarios_passed: number;
    results: ScenarioRunResult[];
}

/**
 * Load a scenario from disk
 */
async function loadScenario(scenarioDir: string): Promise<StepScenario> {
    const scenarioPath = join(scenarioDir, 'scenario.json');
    const content = await fs.readFile(scenarioPath, 'utf-8');
    return JSON.parse(content) as StepScenario;
}

/**
 * Load inputs for a scenario
 */
async function loadInputs(
    scenarioDir: string,
    scenario: StepScenario
): Promise<any> {
    if (scenario.inputs.inline) {
        return scenario.inputs.inline;
    }

    if (scenario.inputs.files && scenario.inputs.files.length > 0) {
        const inputs: Record<string, string> = {};
        for (const file of scenario.inputs.files) {
            const content = await fs.readFile(join(scenarioDir, 'inputs', file), 'utf-8');
            inputs[file] = content;
        }
        return inputs;
    }

    return {};
}

/**
 * Load expected outputs for a scenario
 */
async function loadExpected(
    scenarioDir: string,
    scenario: StepScenario
): Promise<any> {
    if (scenario.expected.inline) {
        return scenario.expected.inline;
    }

    if (scenario.expected.files && scenario.expected.files.length > 0) {
        const expected: Record<string, string> = {};
        for (const file of scenario.expected.files) {
            const content = await fs.readFile(join(scenarioDir, 'expected', file), 'utf-8');
            expected[file] = content;
        }
        return expected;
    }

    return {};
}

/**
 * Compare actual vs expected based on scenario config
 */
function compareResults(
    actual: any,
    expected: any,
    config: StepScenario['compare']
): ComparisonResult {
    switch (config.method) {
        case 'exact_json':
            return exactJsonMatch(actual, expected);

        case 'set_overlap':
            if (Array.isArray(actual) && Array.isArray(expected)) {
                return setOverlap(actual, expected);
            }
            return { pass: false, score: 0, method: 'set_overlap', details: {}, errors: ['Not arrays'] };

        case 'markdown_structure':
            const structConfig = {
                required_sections: expected.required_sections || [],
                require_yaml: expected.require_yaml ?? true,
            };
            return markdownStructure(actual, structConfig);

        case 'schema_json':
            const requiredFields = expected.required_fields || Object.keys(expected);
            return schemaJson(actual, requiredFields);

        case 'hybrid':
            return hybridCompare(actual, expected, {
                jsonFields: expected.required_fields,
                thresholds: config.thresholds,
            });

        default:
            return { pass: false, score: 0, method: 'unknown', details: {}, errors: ['Unknown comparison method'] };
    }
}

/**
 * Execute a step with given inputs
 * This is a simplified version - actual step execution is pluggable
 */
type StepExecutor = (inputs: any, vaultDir: string) => Promise<any>;

const stepExecutors: Partial<Record<StepType, StepExecutor>> = {
    // Gate step executor
    gate: async (inputs, vaultDir) => {
        // This would call runChunkGate
        // For now, return the input as-is for testing the framework
        return inputs;
    },

    // Add more executors as needed
};

/**
 * Run a single scenario
 */
async function runScenario(
    scenarioDir: string,
    vaultDir: string
): Promise<ScenarioRunResult> {
    const start = Date.now();

    try {
        const scenario = await loadScenario(scenarioDir);
        const inputs = await loadInputs(scenarioDir, scenario);
        const expected = await loadExpected(scenarioDir, scenario);

        // Execute step
        const executor = stepExecutors[scenario.step];
        let actual: any;

        if (executor) {
            actual = await executor(inputs, vaultDir);
        } else {
            // Default: pass through inputs (for testing comparison only)
            actual = inputs;
        }

        // Compare
        const comparison = compareResults(actual, expected, scenario.compare);

        return {
            scenario_id: scenario.scenario_id,
            step: scenario.step,
            pass: comparison.pass,
            comparison,
            actual_output: actual,
            expected_output: expected,
            duration_ms: Date.now() - start,
        };

    } catch (error: any) {
        return {
            scenario_id: scenarioDir.split('/').pop() || 'unknown',
            step: 'gate',
            pass: false,
            comparison: { pass: false, score: 0, method: 'error', details: {}, errors: [error.message] },
            actual_output: null,
            expected_output: null,
            duration_ms: Date.now() - start,
            error: error.message,
        };
    }
}

/**
 * Run all scenarios for a step
 */
export async function runStepScenarios(
    step: StepType,
    vaultDir: string
): Promise<ScenarioReport> {
    const scenariosRoot = resolveVaultPath(vaultDir, VAULT_LAYOUT.scenarios, step);
    const runId = `run-${Date.now()}`;

    const results: ScenarioRunResult[] = [];

    try {
        const entries = await fs.readdir(scenariosRoot, { withFileTypes: true });
        const scenarioDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

        for (const scenarioName of scenarioDirs) {
            const scenarioDir = join(scenariosRoot, scenarioName);
            const result = await runScenario(scenarioDir, vaultDir);
            results.push(result);
        }
    } catch (error: any) {
        // No scenarios found or directory doesn't exist
        console.log(`No scenarios found for step: ${step}`);
    }

    const report: ScenarioReport = {
        run_id: runId,
        step,
        timestamp: new Date().toISOString(),
        scenarios_run: results.length,
        scenarios_passed: results.filter(r => r.pass).length,
        results,
    };

    // Save report
    const reportDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runs, 'step_scenarios', step, runId);
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(
        join(reportDir, 'report.json'),
        JSON.stringify(report, null, 2),
        'utf-8'
    );

    return report;
}

/**
 * Register a step executor
 */
export function registerStepExecutor(step: StepType, executor: StepExecutor): void {
    stepExecutors[step] = executor;
}
