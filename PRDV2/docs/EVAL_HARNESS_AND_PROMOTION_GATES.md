# Evaluation Harness and Promotion Gates

Date: 2026-01-03
Applies to: PRD v0.4

## Overview

The evaluation harness compares a baseline (current) promptset/pipeline to a candidate. It runs both against the same corpus and checks expectations and detectors. If hard gates pass and the candidate improves or matches key metrics, it can be promoted.

## Folder structure

Recommended (outside vault, but can also live under `vault/eval/`):

- `eval/corpus/` — representative inputs (files the agent can read)
- `eval/expectations/` — JSON expectations per corpus item
- `eval/baselines/` — stored baseline metric snapshots (optional)

Inside vault:

- `vault/_index/eval/<run-id>.json` — baseline/candidate metrics + comparison
- `vault/_system/eval/eval-<run-id>.md` — report
- `vault/_system/promptsets/PROMOTION_LOG.md` — promotions

## Metrics schema (minimal)

Hard gate metrics:
- `link_resolution_rate` (target: 1.0)
- `required_sections_rate` (target: 1.0)
- `primary_objective_uniqueness_rate` (target: 1.0)
- `provenance_coverage_rate` (target: >= 0.9 by default, configurable)
- `storyboard_beat_link_coverage` (target: >= 0.95, configurable)

Soft metrics:
- `duplicate_candidate_rate` (lower is better)
- `stub_quality_score` (higher is better)
- `operationalization_score` (higher is better)
- `assessment_rubric_score` (higher is better)

## Deterministic detectors (examples)

- Missing required frontmatter keys per note type
- Missing required sections per note type
- Unresolved wikilinks (after stub creation)
- Content artifacts missing exactly one `primary_objective`
- Storyboard beats lacking any links
- Microlearning missing Hook/Core idea/Quick check/Tiny practice

## Promotion gates

1) Hard gates must pass for every corpus item.
2) Candidate must not regress soft metrics beyond configured thresholds.
3) Candidate must not introduce new failure patterns above threshold.

Promotion writes:
- update `promptset-current` to `supersedes` previous
- append to promotion log
- archive old promptset

## Recommended cadence

- Manual runs during development
- Nightly regression runs once stable (optional)
