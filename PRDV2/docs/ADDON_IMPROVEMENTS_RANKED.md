# PRD Add-on — Ranked Improvements (v0.4)

Date: 2026-01-03
Applies to: PRD v0.4

## 1) Improvement #1 — Regression harness + promotion gates (recommended)

Goal: enable safe, compounding iteration. Every promptset or pipeline change must beat a baseline on a fixed evaluation corpus, under hard constraints.

Key ideas:
- Evaluate properties, not “gold text”.
- Use deterministic detectors wherever possible.
- Use a single metrics schema and a promotion gate.
- Store all evidence (inputs, promptset, metrics, report) in the vault system namespace.

Deliverables:
- `eval/corpus/` inputs (small at first, then expand)
- `eval/expectations/` property expectations per item
- `vault/_index/eval/` metrics JSON
- `vault/_system/eval/` human-readable eval reports
- `vault/_system/promptsets/PROMOTION_LOG.md` updates on promotion

## 2) Improvement #2 — Concept normalization (dedupe + aliases)

Goal: prevent entropy (near-duplicates, drifting titles, fragmented hubs).

Mechanics:
- Similarity search (embeddings) + link overlap + objective overlap to propose merge candidates.
- Safe merges via alias/redirect notes, never breaking links.
- Periodic hub reports (top central nodes; candidate duplicates).

## 3) Improvement #3 — Constraint-driven pack planner

Goal: reduce drift and improve consistency of generated artifacts.

Mechanics:
- Assemble a plan first: objective + prerequisites + misconception + activity + assessment mode + size constraints.
- Generate story/storyboard/microlearning/activity/assessment from the plan.
- Verify plan coverage via detectors (e.g., every beat links to at least one planned concept).

## 4) Improvement #4 — Claim-level provenance layer

Goal: improve traceability, safety, and reuse of modeled knowledge.

Mechanics:
- Each modeled note stores 3–10 explicit paraphrased claims.
- Claims link to source anchors and optionally have confidence/coverage tags.
- Content generators prefer claims over freeform paraphrase.

## 5) Improvement #5 — Usage feedback loop

Goal: optimize teaching outcomes using real usage data.

Mechanics:
- Store quiz difficulty, common wrong answers, and facilitator notes.
- Convert repeated errors into misconception notes.
- Refine mastery criteria and assessments based on analytics.

See details:
- `docs/EVAL_HARNESS_AND_PROMOTION_GATES.md`
- `docs/DETECTORS_AND_EXPECTATIONS.md`
