import { join } from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';
import { loadRunbook, validateRunbook, type LoadedRunbook, type RunbookStep } from './runbook-loader.js';
import {
    makeStepDecisions,
    createBudgetState,
    updateBudget,
    checkBudget,
    getBudgetRemaining,
    type DecisionResult,
    type BudgetState
} from './orchestrator-agent.js';
import type { RunLogger } from './run-logger.js';
import type { LLMHandle } from 'volcano-sdk';

/**
 * Step execution result
 */
export interface StepResult {
    step_id: string;
    step_type: string;
    success: boolean;
    outputs: Record<string, any>;
    duration_ms: number;
    error?: string;
}

/**
 * Decision made by orchestrator agent
 */
export interface Decision {
    step_id: string;
    decision_point: string;
    value: any;
    objective?: string;
    rationale?: string;
}

/**
 * Runbook run result
 */
export interface RunbookRunResult {
    run_id: string;
    runbook_id: string;
    runbook_version: string;
    status: 'completed' | 'failed' | 'stopped_at_gate' | 'budget_exceeded';
    steps_completed: number;
    steps_total: number;
    step_results: StepResult[];
    decisions: Decision[];
    budget_usage?: {
        tokens_used: number;
        tokens_budget: number;
        cost_used: number;
        cost_budget: number;
        time_seconds: number;
    };
    start_time: string;
    end_time: string;
    duration_ms: number;
    error?: string;
}

/**
 * Step executor function type
 */
export type StepExecutor = (
    step: RunbookStep,
    inputs: Record<string, any>,
    vaultDir: string,
    llm: LLMHandle,
    logger?: RunLogger
) => Promise<{ success: boolean; outputs: Record<string, any> }>;

/**
 * Registry of step executors
 */
const stepExecutors = new Map<string, StepExecutor>();

/**
 * Register a step executor
 */
export function registerStepExecutor(stepType: string, executor: StepExecutor): void {
    stepExecutors.set(stepType, executor);
}

/**
 * Default step executor (pass-through)
 */
const defaultExecutor: StepExecutor = async (step, inputs) => {
    return { success: true, outputs: inputs };
};

/**
 * Execute a single step
 */
async function executeStep(
    step: RunbookStep,
    inputs: Record<string, any>,
    vaultDir: string,
    llm: LLMHandle,
    logger?: RunLogger
): Promise<StepResult> {
    const start = Date.now();

    try {
        const executor = stepExecutors.get(step.type) || defaultExecutor;
        const result = await executor(step, inputs, vaultDir, llm, logger);

        return {
            step_id: step.id,
            step_type: step.type,
            success: result.success,
            outputs: result.outputs,
            duration_ms: Date.now() - start,
        };
    } catch (error: any) {
        return {
            step_id: step.id,
            step_type: step.type,
            success: false,
            outputs: {},
            duration_ms: Date.now() - start,
            error: error.message,
        };
    }
}

/**
 * Evaluate conditions for a step
 */
function evaluateConditions(
    conditions: Record<string, any> | undefined,
    context: Record<string, any>
): boolean {
    if (!conditions) return true;

    // Simple condition evaluation
    for (const [key, expected] of Object.entries(conditions)) {
        const actual = context[key];
        if (actual !== expected) return false;
    }

    return true;
}

/**
 * Resolve template variables in step inputs
 * Replaces {{variable}} patterns with values from context
 */
function resolveTemplateInputs(
    inputs: Record<string, any>,
    context: Record<string, any>
): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string') {
            // Replace {{variable}} patterns with context values
            resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                return context[varName] !== undefined ? context[varName] : match;
            });
        } else if (typeof value === 'object' && value !== null) {
            // Recursively resolve nested objects
            resolved[key] = resolveTemplateInputs(value, context);
        } else {
            resolved[key] = value;
        }
    }

    return resolved;
}

/**
 * Run a complete runbook
 */
export async function runRunbook(
    runbookId: string,
    vaultDir: string,
    llm: LLMHandle,
    initialInputs: Record<string, any> = {},
    logger?: RunLogger
): Promise<RunbookRunResult> {
    const runId = `run-${Date.now()}`;
    const startTime = new Date();

    // Load runbook
    const loaded = await loadRunbook(vaultDir, runbookId);
    const { definition } = loaded;

    // Validate
    const validation = validateRunbook(definition);
    if (!validation.valid) {
        throw new Error(`Invalid runbook: ${validation.errors.join(', ')}`);
    }

    await logger?.log(`[Runbook] Starting: ${definition.runbook_id} v${definition.version}`);

    // Initialize budget tracking
    let budgetState = createBudgetState(definition.globals);
    await logger?.log(`[Runbook] Budget: tokens=${budgetState.tokens_budget}, cost=${budgetState.cost_budget}, time=${budgetState.time_budget_seconds}s`, 'DEBUG');

    const result: RunbookRunResult = {
        run_id: runId,
        runbook_id: definition.runbook_id,
        runbook_version: definition.version,
        status: 'completed',
        steps_completed: 0,
        steps_total: definition.steps.length,
        step_results: [],
        decisions: [],
        start_time: startTime.toISOString(),
        end_time: '',
        duration_ms: 0,
    };

    // Context accumulates outputs from steps
    let context: Record<string, any> = { ...initialInputs };

    try {
        // Execute steps in order
        for (const step of definition.steps) {
            await logger?.log(`[Runbook] Step: ${step.id} (${step.type})`);

            // Check budget before step
            const budgetCheck = checkBudget(budgetState);
            if (budgetCheck.exceeded) {
                result.status = 'budget_exceeded';
                result.error = budgetCheck.reason;
                await logger?.log(`[Runbook] ${budgetCheck.reason}`, 'WARN');
                break;
            }

            // Check conditions
            if (!evaluateConditions(step.conditions, context)) {
                await logger?.log(`[Runbook] Step ${step.id} skipped (conditions not met)`);
                continue;
            }

            // Process decision points (agentic decisions)
            if (step.decision_points && step.decision_points.length > 0) {
                await logger?.log(`[Runbook] Making ${step.decision_points.length} decision(s) for step ${step.id}`);

                const decisions = await makeStepDecisions(
                    llm,
                    step.decision_points,
                    {
                        step_id: step.id,
                        step_type: step.type,
                        current_state: context,
                        budget_remaining: getBudgetRemaining(budgetState),
                    },
                    logger
                );

                // Record decisions and merge into context
                for (const decision of decisions) {
                    result.decisions.push({
                        step_id: step.id,
                        decision_point: decision.name,
                        value: decision.value,
                        objective: decision.objective,
                        rationale: decision.rationale,
                    });
                    context[decision.name] = decision.value;
                    await logger?.log(`[Runbook] Decision: ${decision.name} = ${decision.value}`);
                }
            }

            // Resolve template variables in step inputs ({{variable}} syntax)
            const resolvedStepInputs = resolveTemplateInputs(step.inputs || {}, context);

            // Merge resolved step inputs with context (context values take precedence for non-template values)
            const stepInputs = { ...context, ...resolvedStepInputs };

            // Execute
            const stepResult = await executeStep(step, stepInputs, vaultDir, llm, logger);
            result.step_results.push(stepResult);

            if (stepResult.success) {
                result.steps_completed++;
                // Merge outputs into context
                context = { ...context, ...stepResult.outputs };
                await logger?.log(`[Runbook] Step ${step.id} completed`);
            } else {
                result.status = 'failed';
                result.error = `Step ${step.id} failed: ${stepResult.error}`;
                await logger?.log(`[Runbook] Step ${step.id} failed: ${stepResult.error}`, 'ERROR');
                break;
            }

            // Check evaluation gates
            if (definition.evaluations) {
                const gateResult = checkEvaluationGate(step.id, context, definition.evaluations);
                if (!gateResult.pass) {
                    result.status = 'stopped_at_gate';
                    result.error = `Evaluation gate failed after step ${step.id}: ${gateResult.reason}`;
                    await logger?.log(`[Runbook] Stopped at gate: ${gateResult.reason}`, 'WARN');
                    break;
                }
            }
        }
    } catch (error: any) {
        result.status = 'failed';
        result.error = error.message;
    }

    const endTime = new Date();
    result.end_time = endTime.toISOString();
    result.duration_ms = endTime.getTime() - startTime.getTime();

    // Add budget usage to result
    result.budget_usage = {
        tokens_used: budgetState.tokens_used,
        tokens_budget: budgetState.tokens_budget === Infinity ? -1 : budgetState.tokens_budget,
        cost_used: budgetState.cost_used,
        cost_budget: budgetState.cost_budget === Infinity ? -1 : budgetState.cost_budget,
        time_seconds: result.duration_ms / 1000,
    };

    // Save run results
    await saveRunResult(vaultDir, runbookId, runId, result);

    await logger?.log(`[Runbook] Finished: ${result.status} (${result.steps_completed}/${result.steps_total} steps)`);

    return result;
}

/**
 * Check evaluation gate
 */
function checkEvaluationGate(
    stepId: string,
    context: Record<string, any>,
    evaluations: Record<string, any>
): { pass: boolean; reason?: string } {
    // Check stepwise thresholds
    const stepGate = evaluations[stepId];
    if (!stepGate) return { pass: true };

    // Simple threshold check
    for (const [metric, threshold] of Object.entries(stepGate)) {
        const value = context[metric];
        if (typeof value === 'number' && typeof threshold === 'number') {
            if (value < threshold) {
                return { pass: false, reason: `${metric} (${value}) below threshold (${threshold})` };
            }
        }
    }

    return { pass: true };
}

/**
 * Save run result to vault
 */
async function saveRunResult(
    vaultDir: string,
    runbookId: string,
    runId: string,
    result: RunbookRunResult
): Promise<void> {
    const runDir = resolveVaultPath(vaultDir, VAULT_LAYOUT.runs, 'runbooks', runbookId, runId);
    await fs.mkdir(runDir, { recursive: true });

    // Save main result
    await fs.writeFile(
        join(runDir, 'run.json'),
        JSON.stringify(result, null, 2),
        'utf-8'
    );

    // Save decisions separately
    if (result.decisions.length > 0) {
        await fs.writeFile(
            join(runDir, 'decisions.json'),
            JSON.stringify(result.decisions, null, 2),
            'utf-8'
        );
    }

    // Save step reports
    const stepReportsDir = join(runDir, 'step_reports');
    await fs.mkdir(stepReportsDir, { recursive: true });
    for (const stepResult of result.step_results) {
        await fs.writeFile(
            join(stepReportsDir, `${stepResult.step_id}.json`),
            JSON.stringify(stepResult, null, 2),
            'utf-8'
        );
    }
}
