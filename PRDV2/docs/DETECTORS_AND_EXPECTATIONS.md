# Detectors and Expectations

Date: 2026-01-03
Applies to: PRD v0.4

## Purpose

Provide a stable set of deterministic checks and property-based expectations used by the regression harness.

## Expectations format

One JSON file per corpus item. Expectations should assert properties, not exact text.

Example fields:
- expected note counts by type
- required links and objective anchoring
- minimum link resolution rate
- minimum provenance coverage

See: `docs/EXPECTATION.schema.json`.

## Detector catalog (starter set)

Schema & structure:
- `required_frontmatter`: validates required keys per note type
- `required_sections`: validates presence of sections per note type
- `primary_objective_singleton`: exactly one primary objective per content artifact
- `provenance_present`: derived_from/provenance coverage per modeled notes

Link integrity:
- `wikilinks_resolve`: links resolve, or stub created
- `no_orphan_objectives`: every objective is referenced by at least one concept or content artifact

Content pack integrity:
- `storyboard_beat_linked`: each beat has >= 1 link
- `microlearning_sections_present`: hook/core/check/practice present

Quality heuristics (deterministic):
- `procedure_steps_have_verbs`: basic verb heuristic
- `stub_has_open_questions`: stub includes at least one open question

## Output format

Detectors output structured findings to:
- `vault/_index/qa/<run-id>.json` for in-run repair
- `vault/_index/eval/<run-id>.json` for regression runs
