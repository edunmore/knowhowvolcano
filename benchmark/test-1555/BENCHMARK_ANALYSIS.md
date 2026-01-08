# Benchmark Analysis Report

**Run ID**: benchmark-1767798150603
**Timestamp**: 2026-01-07T15:02:30.603Z
**Source**: `./benchmark/benchmark_source_raw.md`
**Vault**: `./benchmark/test-1555`

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| Expected Items | 9 |
| Actual Items | 11 |
| Matched | 7 |
| Missing | 2 |
| Extra | 4 |
| **Precision** | 64% |
| **Recall** | 78% |
| **F1 Score** | 70% |

---

## Detailed Matches

| Expected | Type | Matched ID | Status |
|----------|------|------------|--------|
| Outcome Ladder | concept | concept-outcome-ladder | ✅ |
| Friction Budget | principle | concept-friction-budget | ⚠️ 60% |
| 7-Minute Microlearning Loop | procedure | procedure-7-minute-microlearning-loop | ✅ |
| Two-Speed Feedback | concept | procedure-two-speed-feedback | ⚠️ 60% |
| More content means more learning | misconception | misconception-more-content-means-more-learning | ✅ |
| If they understood it once, they will perform it later | misconception | - | ❌ Missing |
| Calibration Loop | concept | concept-calibration-loop | ✅ |
| Prefer Fewer, Stronger Links | principle | principle-prefer-fewer-stronger-links | ✅ |
| Scenario: Blocked deadlines (diagnose before advice) | example | - | ❌ Missing |

## Extra Items (not in expected)

- `example-manager-scenario-missed-deadlines` (example)
- `misconception-recognition-equals-performance` (misconception)
- `principle-spend-friction-where-it-buys-transfer` (principle)
- `principle-toolbox-works-best-for-observable-skills` (principle)

---

## Link Candidates Found

(none found)
