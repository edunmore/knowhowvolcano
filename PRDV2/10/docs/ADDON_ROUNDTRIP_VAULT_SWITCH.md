# Add-on PRD — Round-Trip Self-Improvement using `--vault` (v1.0)

Date: 2026-01-05  
Supersedes: v0.8 round-trip PRD *only in the areas where Git refs were assumed*.  
Depends on: v0.9 Dynamic `--vault` support.  
Optional: Git-based releases (v0.7) can still be layered later, but is not required for this version.

## 1. Goal

Implement the “knowledge → artifact → knowledge” round-trip evaluation and improvement loop using **vault paths** as the unit of isolation and A/B experimentation.

Instead of comparing Git refs, the system compares **two vault roots** created from the same seed/template and promotes improvements by copying selected files back into the baseline/template vault.

## 2. Key idea

A “version” of the system is a **vault directory** (VAULT_ROOT) containing:
- `_system/` prompts, contracts, configs, scenarios, schemas
- content notes / lenses
- indices
- `_runs/` outputs

A/B experiments are done by:
1) cloning/copying the same seed vault into two paths (A and B),
2) applying prompt/config changes only in B,
3) running the same scenario in both,
4) comparing run reports and round-trip metrics,
5) promoting only `_system/` deltas from B back into the template vault.

## 3. CLI requirements

### 3.1 Required flag
All commands accept:
- `--vault <path>`

### 3.2 New helper commands (recommended)
- `vault clone --from <template_path> --to <new_path>`
- `run scenario --scenario <scenario_id>`  (uses `--vault`)
- `compare roundtrip --vaultA <pathA> --vaultB <pathB> --scenario <scenario_id>`
- `promote system --from <pathB> --to <template_path>`

If you don’t want new commands, your agent can implement these as file ops + existing runner.

## 4. Directory conventions (within each VAULT_ROOT)

### 4.1 Scenarios
- `VAULT_ROOT/_system/scenarios/<scenario_id>/scenario.json`

### 4.2 Run outputs
Each scenario run must write:
- `VAULT_ROOT/_runs/<scenario_id>/<run_id>/target.nkm.json`
- `VAULT_ROOT/_runs/<scenario_id>/<run_id>/artifact.md`
- `VAULT_ROOT/_runs/<scenario_id>/<run_id>/recovered.nkm.json`
- `VAULT_ROOT/_runs/<scenario_id>/<run_id>/roundtrip.report.json`
- `VAULT_ROOT/_runs/<scenario_id>/<run_id>/report.json`

### 4.3 Optional releases (folder snapshots; not Git)
To keep history without Git:
- `VAULT_ROOT/_releases/<release_id>/` (copy of `_system/` + optional metadata)
- Or keep a global folder outside the vault: `./releases/<vault_id>/<release_id>/`

## 5. Normalized Knowledge Manifest (NKM)

Same as v0.8: a strict JSON format used for deterministic comparison.

- Target NKM is built from vault knowledge (or from chunks) for the scenario’s topic set.
- Recovered NKM is extracted from the artifact alone (with optional canonical ID matching via a canonical index file).

Schema: `schemas/nkm.schema.json`

## 6. Contracts

### 6.1 Content Manifest at end of generated artifact
Same as v0.8: generator MUST append a `CONTENT_MANIFEST` JSON block at the end of `artifact.md`.

### 6.2 Artifact-to-Knowledge extractor output
Must output strict NKM JSON (source=`recovered`) with evidence anchors (artifact line ranges).

## 7. Round-trip comparator (deterministic)

Same as v0.8: compare target vs recovered NKMs and compute:
- precision / recall / F1 over canonical IDs
- extras_rate
- contradiction_rate (facet-level; optional initially)
- manifest_alignment (intended vs recovered)

Comparator must not call LLMs.

Schema: `schemas/roundtrip.report.schema.json`

## 8. A/B without Git: workflow

### 8.1 Seed/template vault
Maintain one template vault:
- `./vault-templates/edu-template`

This template contains:
- `_system/` (prompts/contracts/config/scenarios/schemas)
- minimal folder skeleton
- optional canonical seed notes (if you want non-empty evaluation)

### 8.2 Create A and B vaults
For each experiment:
- `vaultA = /tmp/edu-vault-A-<id>`
- `vaultB = /tmp/edu-vault-B-<id>`

Copy template to both. Ensure they start identical.

### 8.3 Apply changes to B only
Modify prompts/config in:
- `vaultB/_system/...`

Keep content generation outputs separate (under `_runs/`).

### 8.4 Run scenario on A and B
Run identical `scenario_id` in both vaults.
Ensure both produce `roundtrip.report.json`.

### 8.5 Compare
Read:
- `vaultA/_runs/.../roundtrip.report.json`
- `vaultB/_runs/.../roundtrip.report.json`
And (optional) overall `report.json` for cost and gate stats.

Compute verdict using scenario thresholds.

### 8.6 Promote “learning”
If B wins, copy only the “system learning” back into template:
- `vaultB/_system/prompts/**` → template
- `vaultB/_system/config/**` → template
- `vaultB/_system/contracts/**` → template
- schemas/scenarios if updated

Do **not** copy `_runs/` or generated content unless you intentionally want golden examples.

## 9. Promotion policy (path-based)

Promotion requires (scenario configurable):
- improved `coverage_f1` by Δ OR reduced `extras_rate` without losing recall
- no regression in schema/grounding pass rates (from `report.json`)
- cost multiplier not exceeded

On promotion:
- write a promotion record to the template vault:
  `template/_system/history/promotions/<timestamp>.json` (optional)

## 10. Scenario format updates (v1.0)

Scenario JSON MUST include thresholds and generation constraints as in v0.8.
Additionally, it may include:
- `vault_seed_mode`: `"empty"` or `"snapshot"`
- `promotion`: which paths are promotable (defaults to `_system/**`)

Example: see `examples/scenario.json`.

## 11. Milestones

### M1 — Run outputs per vault
- Ensure runner writes NKM + artifact + roundtrip report into `--vault` path
Acceptance: one vault run produces all required files.

### M2 — Compare command (two vault paths)
- Implement comparator that reads reports from both vaults and prints/verifies verdict
Acceptance: A/B comparison works with vault copies, no Git.

### M3 — Promotion copy
- Implement safe promotion that only copies `_system/**` (or configured paths)
Acceptance: template vault updates, and a new experiment inherits improvements.

### M4 — Automation wrapper (optional)
- Script that performs: clone → patch prompts → run A/B → compare → promote
Acceptance: one command runs a full iteration cycle.

## 12. Acceptance criteria (overall)

A) v0.8 round-trip loop runs using `--vault` and produces deterministic metrics.

B) Two vault paths can be compared and a verdict computed.

C) Improvements can be promoted by copying only system files back to the template vault.

D) No generated content or `_runs/` artifacts leak into the template unless explicitly configured.
