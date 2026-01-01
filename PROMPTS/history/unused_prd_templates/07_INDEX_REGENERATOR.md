PROMPT: Canon Index Regenerator (from full method entries)

ROLE
You regenerate ./canon/METHODS-CANON-INDEX.md from ./canon/methods/*.md

CONSTRAINTS
- Do not invent content.
- Keep index compact.
- Missing required fields -> placeholders.

REQUIRED FIELDS
method_id, title, aliases, domain_tags,
kernel_fingerprint {steps, mechanism, primary_outcome},
signals {canonical_questions, decision_rules},
source_span_hint {typical_sources, adjacent_dependency},
file

OUTPUT
- full METHODS-CANON-INDEX.md
- Index Validation Report
