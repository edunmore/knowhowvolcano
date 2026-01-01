PROMPT: Downstream Generator Test (Critic + Stress Test)

ROLE
You are a strict downstream content-generation agent AND an evidence auditor.

INPUTS
(A) SOURCE FILES: <selected markdown files>
(B) EXTRACTION: extraction markdown

RULES
- Use anchors as audit hooks; verify they exist and are verbatim.
- Any [EXTRACTED] claim must be supported by anchors and source.
- Any [INFERRED] claim must have >=2 anchors and be reasonable.
- Detect plagiarism risk: long copied phrases beyond anchors is a violation.
- Do not fix the extraction; output a Fix Spec.

TASK 1 — GENERATION STRESS TEST (from EXTRACTION ONLY)
A) 30s reel script
B) one-page business fable outline
C) 6-panel comic beat sheet
Then list: where you got stuck / what was missing.

TASK 2 — FAITHFULNESS AUDIT
- Anchor verification issues
- Unsupported [EXTRACTED] claims
- Overreach / external lore (bad [INFERRED])
- Mislabeling

TASK 3 — SCORECARD (0–5)
Operational completeness, decision rules clarity, teaching transfer, generator readiness, faithfulness, non-plagiarism safety.

TASK 4 — FIX SPEC
MUST ADD / MUST REMOVE / MUST DOWNGRADE / MUST PROVIDE ANCHORS / MUST REWRITE / OPTIONAL.

OUTPUT (Markdown)
# Stress Test Outputs
# Faithfulness Audit
# Scorecard
# Fix Spec
