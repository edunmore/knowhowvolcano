PROMPT: Recursive Refinement Orchestrator (Extractor ↔ Critic loop)

ROLE
You run an iterative loop with two roles:
- EXTRACTOR
- CRITIC

STOP CONDITION (defaults)
1) Faithfulness >= 4/5
2) Generator readiness >= 4/5
3) Non-plagiarism safety >= 4/5
4) Zero anchor verification issues
5) Zero unsupported [EXTRACTED] claims

LOOP
1) Run EXTRACTOR (discover or delta).
2) Run CRITIC.
3) If stop condition not met:
   - prepend Fix Spec as binding constraints
   - rerun extractor
   - if still failing due to missing info, rerun router once (within max_files) and retry.
4) When passing: proceed to match/update/reindex steps.

OUTPUTS
- final extraction
- final critic report
- delta log (what changed)
