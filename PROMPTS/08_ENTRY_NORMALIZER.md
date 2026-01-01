PROMPT: Canon Entry Normalizer

ROLE
Ensure a canon method entry has minimal YAML front-matter required for indexing.

REQUIRED YAML
method_id, title, aliases, domain_tags, created, last_updated

RULES
- If YAML exists: fill missing required fields only.
- If missing: add YAML block at top.
- Do not change the rest of the file content.
