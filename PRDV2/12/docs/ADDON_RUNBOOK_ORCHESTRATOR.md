# Add-on PRD — Runbook-Driven Orchestrator (Gigantic Orchestration in the Vault) (v1.2)

Date: 2026-01-05  
Applies to: Education Zettelkasten system (existing implementation)  
Works with: domain vaults (`--vault`, v0.9), primers (v1.1), chunking/gating/windowing (v0.5), lenses (v0.6), stepwise eval (v0.9), round-trip eval (v1.0)

## 1. Goal

Make the orchestration itself a **first-class, versionable asset inside the vault**: a runbook (or set of runbooks) that an “Orchestrator Agent” reads and executes, deciding which specialist agents to run, with conditional logic, budgets, and evaluation gates.

This enables:
- domain-specific workflows (“coaching vault runbooks” vs “negotiation vault runbooks”)
- easier optimization (swap steps, models, thresholds without code changes)
- controlled autonomy (the agent can choose what to run next, but within declared constraints)
- shareable vault packages (knowledge + system logic, without sources)

## 2. Non-goals

- Replacing your runtime/agent platform (Volcano stays the platform).
- A full visual GUI (hooks are specified, UI comes later).
- A full optimizer/search algorithm for prompt evolution (can be layered later); this PRD focuses on “runbooks as the control plane.”

## 3. Core concept

A **Runbook** is a declarative workflow file stored in the vault, e.g.:  
`VAULT_ROOT/_system/runbooks/ingest_and_model.yml`

At runtime, you invoke:
`research run --vault <path> --runbook ingest_and_model`

The system loads:
- vault primer (v1.1)
- runbook definition (this PRD)
- contracts/schemas for each step
and then the Orchestrator Agent executes the plan, calling specialist agents/tools as declared.

## 4. Runbook anatomy

A runbook has:
- metadata (id, description, domain constraints)
- global budgets (token/cost/time ceilings)
- inputs (files, folders, topic ids)
- steps (a DAG or ordered list)
- conditions (skip/branch based on gate outputs)
- artifacts (what files each step must write)
- evaluation gates (stepwise thresholds; optional round-trip thresholds)
- promotion rules (which changes are allowed to persist back into the vault template)

Runbooks are stored in the vault, so they can be different per domain vault and evolve independently.

## 5. Runbook execution model

### 5.1 Two-level control
Level 1 (deterministic engine): executes the runbook structure, handles file IO, passes inputs/outputs, validates schemas, enforces budgets.

Level 2 (Orchestrator Agent): makes bounded decisions where the runbook allows it, e.g.:
- choose chunk size/stride within allowed ranges
- decide whether to run a deeper model pass if gate score is borderline
- choose which lens/modeling technique to apply (e.g. baseline vs DBM lens)
- decide which candidates to prioritize under a token budget

All decisions must be written to:
`VAULT_ROOT/_runs/<run_id>/decisions.json`

### 5.2 “Bounded autonomy” mechanism
Each step can define:
- `decision_points`: explicit choices allowed
- `allowed_values` / ranges
- `objective`: what metric to optimize (coverage_f1, cost, link_density, etc.)
- `guardrails`: hard constraints

If a step has no decision points, it is executed deterministically.

## 6. Files and folders

### 6.1 Runbooks
`VAULT_ROOT/_system/runbooks/*.yml`

### 6.2 Runbook templates (optional shared)
If you use `--shared-system`, allow shared runbooks with vault overrides:
- shared: `SHARED/_system/runbooks/*`
- local: `VAULT/_system/runbooks/*` (overrides by id)

### 6.3 Run outputs
`VAULT_ROOT/_runs/runbooks/<runbook_id>/<run_id>/...`
Must include:
- `run.json` (inputs, versions, model ids)
- `decisions.json` (agent choices)
- `step_reports/<step_id>.json`
- `summary.json` (aggregated metrics)
- artifacts produced by steps (notes, indices, manifests)

## 7. Runbook schema

Runbook files must validate against `schemas/runbook.schema.json`.

Key fields:
- `runbook_id`
- `version`
- `globals`: budgets, defaults, model routing
- `inputs`: declared inputs
- `steps`: list of steps with `id`, `type`, `inputs`, `outputs`, `agent`, `prompt`, `contracts`, `decisions`, `conditions`
- `evaluations`: stepwise and/or round-trip gates
- `persistence`: what the run is allowed to write back (e.g., content only; or prompts too)

## 8. Step types (initial)

- `ingest_source` (optional; may be replaced by chunk-first approach)
- `chunk_stream` (split input into windows; writes chunk notes or temporary chunk files)
- `gate_chunk` (classify relevance; can use local qwen8b via ollama)
- `extract_candidates` (optional if you prefer model-in-one-pass)
- `model_notes` (create/merge concept/procedure/etc. notes)
- `mark_links` (produce link-intents; does NOT resolve)
- `resolve_links` (map link-intents to existing notes or create stubs)
- `verify` (schema + grounding)
- `generate_artifact` (story/microlearning/procedure/learning path)
- `extract_nkm` (from artifact)
- `roundtrip_compare` (deterministic)
- `report` (aggregate)

You can add more step types later. The schema supports custom steps with a “tool contract” declared.

## 9. Token/cost optimization hooks

Runbooks make token policy explicit:
- use `gate_chunk` with local model first
- only promote chunks above relevance threshold to “expensive” modeling
- keep “prev/current/next window” sizes within declared max chars
- use “index retrieval top-k” for resolver instead of full vault index
- allow a “single-pass modeler” option where the modeler both extracts + models within the window to avoid double-reading

All of these become runbook knobs rather than hardcoded behavior.

## 10. Sharing vaults

A vault can be shared as a “knowledge package” if it excludes sources and includes only:
- paraphrased notes and generated educational artifacts
- system logic (runbooks, prompts, primers, schemas)
- provenance metadata for internal traceability (source ids, hashes) without embedding copyrighted text

Define a packaging command:
`vault pack --vault <path> --profile shareable`
This produces a zip that excludes `sources/` (or `_sources/`) and excludes raw chunks if you consider them too close to the original.

## 11. Milestones

### M1 — Runbook schema + loader
Deliver:
- `runbook.schema.json`
- load/validate runbook from `--vault`
Acceptance:
- runner refuses invalid runbooks with actionable errors.

### M2 — Deterministic runbook engine
Deliver:
- step execution with declared inputs/outputs
- artifact existence checks
- schema validation hooks
Acceptance:
- at least one example runbook executes end-to-end.

### M3 — Orchestrator Agent “decision points”
Deliver:
- decision interface per step (allowed ranges, objective, guardrails)
- decisions logged to `decisions.json`
Acceptance:
- runbook can let agent choose (e.g. chunk size) and decisions are reproducible.

### M4 — Evaluation gates inside runbook
Deliver:
- stepwise thresholds (v0.9 scenarios reused)
- optional round-trip thresholds (v1.0)
Acceptance:
- runbook can stop early on failed gates and emit report.

### M5 — Shareable packaging profile
Deliver:
- `vault pack --profile shareable`
Acceptance:
- packaged zip contains no sources/raw text but keeps knowledge + system.

## 12. Acceptance criteria (overall)

A) A domain vault contains runbooks that fully define how to process inputs in that domain.  
B) The Orchestrator Agent can make bounded choices and logs them.  
C) Steps are measurable and gateable; runs stop early when they should.  
D) Token/cost policy is controlled by runbook knobs, not scattered in prompts.  
E) Vaults can be packaged for sharing under explicit exclusion rules.
