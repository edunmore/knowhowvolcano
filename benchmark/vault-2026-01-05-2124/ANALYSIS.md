# Benchmark Analysis Report

**Run Date**: 2026-01-05 21:24  
**Source**: `benchmark_source_raw.md`  
**Vault**: `vault-2026-01-05-2124`

---

## Summary

| Metric | Expected | Actual | Match |
|--------|----------|--------|-------|
| Concepts | 3 | 3 | ✅ 100% |
| Principles | 2 | 2 | ✅ 100% |
| Procedure | 1 | 1 | ✅ 100% |
| Misconceptions | 2 | 2 | ✅ 100% |
| Examples | 1 | 0 | ❌ Missing |
| **Total Notes** | **9** | **8** | **89%** |

---

## Detailed Comparison

### Expected Items (from benchmark_expected.json)

| Type | Expected Title | Actual ID | Status |
|------|----------------|-----------|--------|
| concept | Outcome Ladder | `concept-outcome-ladder` | ✅ |
| principle | Friction Budget | `principle-friction-budget` | ✅ |
| procedure | 7-Minute Microlearning Loop | `procedure-7-minute-microlearning-loop` | ✅ |
| concept | Two-Speed Feedback | `concept-two-speed-feedback` | ✅ |
| misconception | More content means more learning | `misconception-more-content-means-more-learning` | ✅ |
| misconception | If they understood it once... | `misconception-recognition-equals-performance` | ✅ (title varies) |
| concept | Calibration Loop | `concept-calibration-loop` | ✅ |
| principle | Prefer Fewer, Stronger Links | `principle-prefer-fewer-stronger-links` | ✅ |
| example | Scenario: Blocked deadlines | (none) | ❌ Not extracted |

---

## Link Candidates Analysis

### Expected Inline Links (high-confidence)
- Outcome Ladder → ✅ Created
- Friction Budget → ✅ Created
- 7-Minute Microlearning Loop → ✅ Created
- Two-Speed Feedback → ✅ Created
- Calibration Loop → ✅ Created
- Interference → ❌ Not extracted (mentioned in context section)

### Expected Link Candidates (low-confidence stubs)
- Cognitive Load → Check if mentioned in notes
- Spaced Repetition → Check if mentioned in notes
- Interference under Stress → Check if mentioned in notes
- Deliberate Practice → Check if mentioned in notes
- Scenario-Based Learning → Not extracted
- Decision Under Uncertainty → Not extracted

---

## Observations

### What Worked Well
1. **Type classification**: 100% correct types for extracted items
2. **Core concepts captured**: All main concepts, principles, and misconceptions extracted
3. **Procedure extraction**: The 7-step procedure was correctly identified
4. **Verification**: All notes passed grounding checks

### What's Missing
1. **Example type not supported**: The system has no "example" note type, so the scenario wasn't extracted
2. **Interference concept**: Mentioned in context section but not extracted as a concept
3. **Link resolution**: The resolver found 0 candidates to process (format mismatch)

### Recommendations
1. Add "example" or "scenario" note type to ontology
2. Improve context section scanning for implicit concepts
3. Fix link resolver parsing to match the `- Term (reason)` format

---

## Sample Note Quality

### concept-outcome-ladder.md
```markdown
## Definition
The Outcome Ladder is a framework for classifying learning outcomes into four hierarchical rungs:
- Rung A: Remember (recall terms)
- Rung B: Recognize (identify correct option from examples)
- Rung C: Perform (execute behavior in realistic scenario)
- Rung D: Transfer (execute later, in different context, under stress)

## Link candidates
- transfer (technical_term)
- performance (related_construct)
- deliberate practice (related_construct)
- Rung A, B, C, D (technical_term)
```

---

## Next Steps

1. ✅ Benchmark run successful
2. Re-run after adding "example" note type
3. Compare with future runs after prompt improvements
