# PRD Add-on — Self-improvement, Prompts in Vault, and Prompt Contract

Date: 2026-01-03
Applies to: PRD v0.3

## 1. Summary

This add-on introduces:
- prompts stored as first-class vault assets (`system_prompt`)
- a documented prompt templating contract (variable injection)
- a gated self-improvement loop (in-run repair + cross-run prompt evolution)

It builds on the objective/storyboard/microlearning model introduced in v0.2.

## 2. Design overview

The vault remains the source of truth for educational notes. Prompts are treated as system assets stored under `vault/_system/`. The pipeline executes prompts via a standard rendering flow:

prompt note → validate context → render template → run step → QA → (optional repair).

## 3. System namespace layout

Recommended folders:

- `vault/_system/prompts/` — prompt notes (`system_prompt`)
- `vault/_system/promptsets/` — pinned releases
- `vault/_system/eval/` — human-readable eval reports
- `vault/_index/eval/` — machine-readable metrics (JSON)

Optionally:
- `vault/eval/corpus/` — evaluation inputs
- `vault/eval/expectations/` — property-based expectations

## 4. In-run repair loop (fast feedback)

After each run:
- QA/Verifier produces `vault/_index/qa/<run-id>.json` with issues.
- Coordinator creates a targeted fix plan and re-runs only failing step(s).
- Repaired artifacts overwrite staged outputs and re-indexing runs once.

This improves output quality without changing promptsets globally.

## 5. Cross-run prompt evolution loop (compounding improvement)

Artifacts:
- baseline promptset (current)
- candidate promptset (proposed)
- evaluation corpus + expectations
- regression metrics + gates

Workflow:
- Evaluator runs baseline and candidate across the corpus.
- Metrics are compared (property-based, not “gold text”).
- If gates pass, candidate is promoted to current and recorded in a promotion log.
- If gates fail, a `failure_pattern` note is updated/created and linked to the affected prompts.

## 6. Metrics and gates (recommended)

Hard gates:
- 100% link resolution after stub creation
- 100% required sections present per note type
- provenance coverage above threshold (e.g., ≥ 90% modeled notes include `derived_from`)
- story pack integrity: storyboard beats link coverage (e.g., ≥ 95% beats link to at least one concept/procedure/misconception)
- exactly one `primary_objective` per content artifact

Soft metrics (optimize over time):
- stub quality score (presence of open questions + scoped title)
- duplicate concept warnings per run
- operationalization completeness score
- assessment quality rubric score

## 7. Recommended minimal implementation

Start with:
- storing prompts as vault notes
- a simple renderer + validator (Handlebars + Zod/AJV)
- property-based regression over a small corpus (5–20 items)
- promotion gate that only looks at hard gates

Then add:
- failure pattern catalog
- automatic candidate prompt generation from evaluator suggestions
- richer judge rubrics for story packs and assessments

See also:
- `docs/PROMPT_CONTRACT.md`
- `docs/PROMPT_EVOLUTION_WORKFLOW.md`
