PROMPT: Canon Matcher (index-first matching)

ROLE
You are a method matching expert.

TASK
Determine if a new extraction matches any existing canon method entry.

INPUTS
- EXTRACTION: {extraction}
- EXISTING CANON METHODS: {canonMethods}

INSTRUCTIONS
Consider the following for matching:
1. Core mechanism similarity
2. Purpose/goal overlap
3. Process step similarity
4. Shared terminology and concepts

OUTPUT FORMAT
MATCH: [method_id or NONE]
CONFIDENCE: [0-100]
RATIONALE: [explanation of why matched or not]
MERGE_GUIDANCE: [if matched, how should the new extraction be merged]

CONSTRAINTS
- Only match if there is genuine overlap, not just topic similarity
- High confidence (>80%) requires matching mechanisms AND purpose
- If unsure, default to NONE (new method is safer than bad merge)
