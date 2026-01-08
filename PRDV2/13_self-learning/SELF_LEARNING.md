# Self-Learning Prompt Improvement

## Status: NEXT FEATURE

## Problem
When verification fails, it indicates prompts need improvement. Currently this requires manual analysis.

## Goal
Automate the feedback loop: failures → analyze patterns → improve prompts → verify improvement.

## Current Groundwork ✅
- `_system/failures/*.json` - Logs each failure with full context
- `scripts/analyze-failures.ts` - Generates pattern summary
- `FAILURE_ANALYSIS.md` - Human-readable report

## Proposed Implementation

### Phase 1: Pattern Detection
```
Agent reads _system/failures/*.json
Groups by issue type
Identifies most common failure patterns
```

### Phase 2: Prompt Modification
```
Agent reads failing prompt file
Uses LLM to suggest improvements
Creates modified prompt version
```

### Phase 3: A/B Testing  
```
Run extraction with old vs new prompt
Compare pass rates
If improved, promote new prompt
```

## Key Files to Modify
- `src/systems/research/utils/failure-log.ts` - Already logs failures
- `src/systems/research/vault/_system/prompts/*.md` - Target for improvements
- NEW: `src/systems/research/agents/self-learner.ts` - The learning agent

## Commands After Implementation
```bash
# Analyze failures and suggest prompt improvements
npx tsx src/systems/research/cli.ts learn --vault ./vault

# Apply suggested improvements
npx tsx src/systems/research/cli.ts learn --vault ./vault --apply
```

## Success Metrics
- Reduce verification failure rate from ~30% to <10%
- Automatic prompt versioning in `_system/promptsets/`
- Measurable F1 improvement on benchmarks
