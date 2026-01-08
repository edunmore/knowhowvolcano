/**
 * Orchestrator Agent - Makes bounded decisions within runbook constraints
 * 
 * This agent is invoked when a runbook step has decision_points that need
 * to be resolved. It uses an LLM to make optimal choices within the allowed
 * ranges, guided by objectives and guardrails.
 */

import { agent } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import type { RunLogger } from './run-logger.js';
import { readFileSync, existsSync } from 'node:fs';
import { resolveVaultPath, VAULT_LAYOUT } from './utils/vault-utils.js';

/**
 * Decision point definition from runbook step
 */
export interface DecisionPoint {
    name: string;
    allowed: Record<string, any>;  // { min: number, max: number } OR string[] OR { options: string[] }
    objective?: string;            // What metric to optimize
    guardrails?: Record<string, any>;  // Hard constraints
}

/**
 * Decision made by the orchestrator
 */
export interface DecisionResult {
    name: string;
    value: any;
    rationale: string;
    objective?: string;
}

/**
 * Context provided to the orchestrator for decision making
 */
export interface DecisionContext {
    step_id: string;
    step_type: string;
    current_state: Record<string, any>;  // Accumulated outputs from prior steps
    budget_remaining?: {
        tokens?: number;
        cost?: number;
        time_seconds?: number;
    };
}

/**
 * Format allowed values for prompt
 */
function formatAllowed(allowed: Record<string, any>): string {
    if ('min' in allowed && 'max' in allowed) {
        return `Range: ${allowed.min} to ${allowed.max}`;
    }
    if ('options' in allowed && Array.isArray(allowed.options)) {
        return `Options: ${allowed.options.join(', ')}`;
    }
    if (Array.isArray(allowed)) {
        return `Options: ${allowed.join(', ')}`;
    }
    return JSON.stringify(allowed);
}

/**
 * Format guardrails for prompt
 */
function formatGuardrails(guardrails?: Record<string, any>): string {
    if (!guardrails) return 'None specified';
    return Object.entries(guardrails)
        .map(([key, val]) => `- ${key}: ${val}`)
        .join('\n');
}

/**
 * Parse decision from LLM response
 */
function parseDecisionResponse(response: string, decisionPoint: DecisionPoint): DecisionResult | null {
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        let value = parsed.value ?? parsed.decision ?? parsed.chosen;
        const rationale = parsed.rationale ?? parsed.reasoning ?? 'No rationale provided';

        // Validate value is within allowed range
        const allowed = decisionPoint.allowed;
        if ('min' in allowed && 'max' in allowed) {
            const numValue = Number(value);
            if (isNaN(numValue)) return null;
            value = Math.max(allowed.min, Math.min(allowed.max, numValue));
        } else if ('options' in allowed && Array.isArray(allowed.options)) {
            if (!allowed.options.includes(value)) {
                value = allowed.options[0];  // Default to first option
            }
        } else if (Array.isArray(allowed)) {
            if (!allowed.includes(value)) {
                value = allowed[0];
            }
        }

        return {
            name: decisionPoint.name,
            value,
            rationale,
            objective: decisionPoint.objective,
        };
    } catch {
        return null;
    }
}

/**
 * Get default value for a decision point (fallback)
 */
function getDefaultValue(allowed: Record<string, any>): any {
    if ('min' in allowed && 'max' in allowed) {
        return Math.floor((allowed.min + allowed.max) / 2);
    }
    if ('options' in allowed && Array.isArray(allowed.options)) {
        return allowed.options[0];
    }
    if (Array.isArray(allowed)) {
        return allowed[0];
    }
    if ('default' in allowed) {
        return allowed.default;
    }
    return null;
}

/**
 * Load orchestrator prompt from vault
 */
function loadOrchestratorPrompt(vaultDir: string): string {
    const promptPath = resolveVaultPath(vaultDir, VAULT_LAYOUT.prompts, 'prompt-orchestrator-decision.md');
    if (!existsSync(promptPath)) {
        throw new Error(`Orchestrator prompt not found: ${promptPath}. NO PROMPTS IN CODE - create vault file.`);
    }
    const content = readFileSync(promptPath, 'utf-8');
    // Remove YAML frontmatter
    const bodyMatch = content.match(/---[\s\S]*?---\n([\s\S]*)/);
    return bodyMatch ? bodyMatch[1] : content;
}

/**
 * Make a decision for a single decision point using LLM
 * Prompt loaded from _system/prompts/prompt-orchestrator-decision.md
 */
export async function makeDecision(
    llm: LLMHandle,
    decisionPoint: DecisionPoint,
    context: DecisionContext,
    logger?: RunLogger,
    vaultDir?: string
): Promise<DecisionResult> {
    // Load prompt from vault and substitute variables
    const templateVault = vaultDir || './vault';
    let prompt: string;
    try {
        prompt = loadOrchestratorPrompt(templateVault)
            .replace(/\{\{step_id\}\}/g, context.step_id)
            .replace(/\{\{step_type\}\}/g, context.step_type)
            .replace(/\{\{decision_name\}\}/g, decisionPoint.name)
            .replace(/\{\{allowed_values\}\}/g, formatAllowed(decisionPoint.allowed))
            .replace(/\{\{objective\}\}/g, decisionPoint.objective || 'Optimize for quality and efficiency')
            .replace(/\{\{guardrails\}\}/g, formatGuardrails(decisionPoint.guardrails))
            .replace(/\{\{current_state\}\}/g, JSON.stringify(context.current_state, null, 2))
            .replace(/\{\{budget_remaining\}\}/g, context.budget_remaining ? JSON.stringify(context.budget_remaining) : 'No budget constraints');
    } catch {
        // Fallback for when vault not available (e.g., testing)
        prompt = `You are an Orchestrator Agent. Decision: ${decisionPoint.name}. ${formatAllowed(decisionPoint.allowed)}. Respond with JSON: {"value": <chosen value>, "rationale": "..."}`;
    }

    try {
        const result = await agent({ llm, name: 'OrchestratorAgent' })
            .then({ prompt })
            .run();

        const response = result[0]?.llmOutput || '';
        const decision = parseDecisionResponse(response, decisionPoint);

        if (decision) {
            await logger?.log(`[Orchestrator] Decision: ${decisionPoint.name} = ${decision.value} (${decision.rationale})`, 'DEBUG');
            return decision;
        }

        // Fallback to default
        const defaultValue = getDefaultValue(decisionPoint.allowed);
        await logger?.log(`[Orchestrator] Decision parse failed, using default: ${decisionPoint.name} = ${defaultValue}`, 'WARN');
        return {
            name: decisionPoint.name,
            value: defaultValue,
            rationale: 'Fallback to default value (LLM response could not be parsed)',
        };

    } catch (error: any) {
        // Error - use default
        const defaultValue = getDefaultValue(decisionPoint.allowed);
        await logger?.log(`[Orchestrator] Decision failed: ${error.message}. Using default: ${defaultValue}`, 'WARN');
        return {
            name: decisionPoint.name,
            value: defaultValue,
            rationale: `Error: ${error.message}. Fallback to default.`,
        };
    }
}

/**
 * Make all decisions for a step's decision points
 */
export async function makeStepDecisions(
    llm: LLMHandle,
    decisionPoints: DecisionPoint[],
    context: DecisionContext,
    logger?: RunLogger
): Promise<DecisionResult[]> {
    const decisions: DecisionResult[] = [];

    for (const dp of decisionPoints) {
        const decision = await makeDecision(llm, dp, context, logger);
        decisions.push(decision);
    }

    return decisions;
}

/**
 * Budget tracking state
 */
export interface BudgetState {
    tokens_used: number;
    tokens_budget: number;
    cost_used: number;
    cost_budget: number;
    start_time: number;
    time_budget_seconds: number;
}

/**
 * Create initial budget state from runbook globals
 */
export function createBudgetState(globals?: Record<string, any>): BudgetState {
    return {
        tokens_used: 0,
        tokens_budget: globals?.token_budget ?? Infinity,
        cost_used: 0,
        cost_budget: globals?.cost_ceiling ?? Infinity,
        start_time: Date.now(),
        time_budget_seconds: globals?.time_ceiling_seconds ?? Infinity,
    };
}

/**
 * Update budget state after a step
 */
export function updateBudget(state: BudgetState, tokensUsed: number, costUsed: number): BudgetState {
    return {
        ...state,
        tokens_used: state.tokens_used + tokensUsed,
        cost_used: state.cost_used + costUsed,
    };
}

/**
 * Check if budget is exceeded
 */
export function checkBudget(state: BudgetState): { exceeded: boolean; reason?: string } {
    if (state.tokens_used >= state.tokens_budget) {
        return { exceeded: true, reason: `Token budget exceeded: ${state.tokens_used}/${state.tokens_budget}` };
    }
    if (state.cost_used >= state.cost_budget) {
        return { exceeded: true, reason: `Cost budget exceeded: ${state.cost_used}/${state.cost_budget}` };
    }
    const elapsed = (Date.now() - state.start_time) / 1000;
    if (elapsed >= state.time_budget_seconds) {
        return { exceeded: true, reason: `Time budget exceeded: ${elapsed}s/${state.time_budget_seconds}s` };
    }
    return { exceeded: false };
}

/**
 * Get budget remaining for decision context
 */
export function getBudgetRemaining(state: BudgetState): DecisionContext['budget_remaining'] {
    const elapsed = (Date.now() - state.start_time) / 1000;
    return {
        tokens: state.tokens_budget === Infinity ? undefined : state.tokens_budget - state.tokens_used,
        cost: state.cost_budget === Infinity ? undefined : state.cost_budget - state.cost_used,
        time_seconds: state.time_budget_seconds === Infinity ? undefined : state.time_budget_seconds - elapsed,
    };
}
