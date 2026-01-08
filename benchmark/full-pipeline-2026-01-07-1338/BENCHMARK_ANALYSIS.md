# Benchmark Analysis Report

**Run ID**: benchmark-1767790534574
**Timestamp**: 2026-01-07T12:55:34.574Z
**Source**: `./benchmark/benchmark_source_raw.md`
**Vault**: `./benchmark/full-pipeline-2026-01-07-1338`

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| Expected Items | 9 |
| Actual Items | 10 |
| Matched | 7 |
| Missing | 2 |
| Extra | 3 |
| **Precision** | 70% |
| **Recall** | 78% |
| **F1 Score** | 74% |

---

## Detailed Matches

| Expected | Type | Matched ID | Status |
|----------|------|------------|--------|
| Outcome Ladder | concept | concept-outcome-ladder | ✅ |
| Friction Budget | principle | concept-friction-budget | ⚠️ 60% |
| 7-Minute Microlearning Loop | procedure | procedure-7-minute-microlearning-loop | ✅ |
| Two-Speed Feedback | concept | principle-two-speed-feedback | ⚠️ 60% |
| More content means more learning | misconception | misconception-more-content-means-more-learning | ✅ |
| If they understood it once, they will perform it later | misconception | - | ❌ Missing |
| Calibration Loop | concept | concept-calibration-loop | ✅ |
| Prefer Fewer, Stronger Links | principle | principle-prefer-fewer-stronger-links | ✅ |
| Scenario: Blocked deadlines (diagnose before advice) | example | - | ❌ Missing |

## Extra Items (not in expected)

- `example-manager-coaching-scenario` (example)
- `misconception-recognition-equals-performance` (misconception)
- `principle-spend-friction-where-it-buys-transfer` (principle)

---

## Link Candidates Found

(none found)
