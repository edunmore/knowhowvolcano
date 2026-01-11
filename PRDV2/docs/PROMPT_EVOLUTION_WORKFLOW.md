# Prompt Evolution Workflow (Volcano)

Date: 2026-01-03

This workflow defines how prompt improvements are proposed, evaluated, and promoted.

## 1. Roles

- Coordinator: runs the evolution pipeline
- Evaluator: computes metrics and compares baseline vs candidate
- PromptEditor: proposes changes (writes candidate prompts/promptset)
- QA/Verifier: validates outputs and produces issue lists
- (Optional) FailureCataloger: updates failure_pattern notes

## 2. Inputs

- Baseline promptset: `vault/_system/promptsets/promptset-current.md`
- Candidate promptset: `vault/_system/promptsets/promptset-candidate-<id>.md`
- Evaluation corpus: `eval/corpus/`
- Expectations: `eval/expectations/*.json`

## 3. Steps

1) Run baseline across corpus; store metrics JSON.
2) Run candidate across corpus; store metrics JSON.
3) Compare metrics; apply gates; write `eval_report`.
4) If gates pass:
   - update `promptset-current` to supersede baseline
   - archive old promptset
5) If gates fail:
   - write a failure summary
   - link failures to affected prompts
   - keep candidate as rejected with reasons

## 4. Output artifacts

- `vault/_system/eval/eval-<run-id>.md`
- `vault/_index/eval/<run-id>.json` (baseline + candidate + comparison)
- promotion log: `vault/_system/promptsets/PROMOTION_LOG.md`

## 5. Property-based expectations

Expectations should assert properties such as:
- number of notes created by type
- presence of required sections
- link resolution rate
- objective anchoring
- storyboard/microlearning completeness
- provenance coverage

Avoid brittle “expected text” comparisons.
