# Milestone plan — DBM Lens (v0.6)

Date: 2026-01-04

## Milestone M1 — Lens Scaffolding
Goal: introduce lens infrastructure with no behavior change unless enabled.

Steps:
1) Add a LensRegistry with config `lens_id -> prompt_path, output_root, routing_policy`.
2) Define a LensRunner interface and integrate into orchestrator after window assembly.
3) Implement vault writer for `_lenses/<lens_id>/renditions/`.
4) Extend indexer to include `lens_rendition` notes.
5) Add CLI flag `--lenses` with default `edu`.

Deliverables:
- Working `--lenses edu,dbm` that produces at least one DBM rendition file using a placeholder prompt (but schema-correct).

## Milestone M2 — DBM Rendition Quality
Goal: implement DBM prompt and schema so outputs are useful and grounded.

Steps:
1) Add `prompt-dbm-model.md` with strict output schema and Gap Statement rules.
2) Implement Mode A targeting: DBM lens runs for canonical notes touched in CURRENT.
3) Optional: add `prompt-verify-dbm-rendition.md` (schema-only).
4) Add tests for required sections and YAML fields.

Deliverables:
- Renditions include TOTE/indicators/failure modes/calibration/gaps as needed, grounded.

## Milestone M3 — Remodel
Goal: rerun DBM over existing stored evidence without re-ingestion.

Steps:
1) Add `--lens dbm --remodel` mode that iterates windows across stored chunks.
2) Ensure stable rendition IDs (update-in-place) OR create deterministic versioning.
3) Emit `_runs/<run_id>.json` including stats and failures.

Deliverables:
- DBM can be rerun with a new prompt/model and updates appear without re-ingestion.

## Milestone M4 — Patch proposals + promotion gate (optional)
Goal: propose canonical improvements safely.

Steps:
1) Emit patch proposals as JSON with evidence pointers.
2) Implement promotion command with grounding validation against chunks.
3) Add tests for “no destructive downgrade” of canonical notes.

Deliverables:
- Safe promotion flow, file-based, optional to enable.
