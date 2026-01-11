1) Fix the hard contract mismatch (must be done first)
1.1 Make derived_from a YAML frontmatter field (modeler prompt is wrong)

Right now prompt-model-artifact.md says “Add a derived_from link,” but the schema examples do not actually include a derived_from: YAML field; they only include a “Links / Derived from:” line in the body. 

prompt-model-artifact

 The verifier explicitly requires a derived_from link and the run shows it expects it in YAML frontmatter (“not just in the body”). 

run

 

run

Agent instruction: update prompt-model-artifact.md schemas so every type includes YAML like:

---
id: concept-<slug>
type: concept
tags: [concept, extracted]
derived_from: [[source-a-note-to-the-reader]]
---


Then decide whether you still want a body “Links” section; if yes, keep it, but the YAML must exist.

1.2 Remove the “placeholder deadlock” (modeler and verifier contradict each other)

The modeler is explicitly told it can output “Insufficient evidence in source text.” for Operationalization/Boundary conditions. 

prompt-model-artifact

 The verifier explicitly rejects that placeholder as unacceptable content, and it treats those sections as required. 

run

 

run

Agent instruction: pick one of these two designs and make both prompts match it:

Design A (recommended): “Gap statements are allowed, but must be useful.”
Keep the sections required, but change the verifier rule from “no placeholders” to “no empty placeholders.” Concretely: a section may state that the source doesn’t specify it, but it must add at least one specific “what evidence would be needed” question. This avoids hallucination and still satisfies “must contain explanatory content.”

Example acceptable content:

“Not specified in this source. To operationalize, future sources must specify observable leader behaviors (e.g., what leaders do/say) and a performance indicator used in context. Open question: which behaviors are considered ‘coaching style’ in this book?”

Then update the modeler to output that format instead of the bare placeholder string.

Design B: “Stub/partial note mode.”
If evidence is insufficient, the modeler outputs a stub variant (e.g., status: stub in YAML) and the verifier switches to a stub schema for that note type (minimal required sections + explicit gaps). This is cleaner long-term, but requires a small orchestration change (note_type passed to verifier must reflect stub mode).

Either way, don’t keep the current “modeler may output X, verifier rejects X” situation. Your log shows that it guarantees repeated failure for concepts like “Coaching Style Leadership” and “Leader Coach.” 

run

 

run

2) Fix modeling context starvation properly (quote-only is too thin)

In the run, the modeler receives a single sentence as “Context” for each concept. 

run

 

run

 That makes Operationalization/Boundary conditions hard to ground even when the chapter contains more relevant surrounding explanation.

Agent instruction (minimal code change, no extractor changes required): in the orchestrator, derive a context window from the full source text by locating the extracted quote and slicing around it:

start = max(0, idx - 2000)

end = min(len, idx + quote.length + 2000)

Pass that window as source_context instead of the quote. Your extractor already promises the quote is an “Exact substring,” so indexOf is workable as a first pass. 

prompt-extract-candidates

 If duplicates occur, then add offsets in the extractor output later.

This one change typically reduces hallucination and reduces “insufficient evidence” cases because the modeler sees adjacent constraints, examples, and qualifiers.

3) Enforce type correctness on MERGE (don’t allow “type mismatch consideration”)

Your resolver prompt says “Only match if the type is compatible (concept <-> concept).” 

prompt-resolve-entities

 Yet its output merges across concept/principle mismatches with a justification (“types can be related”). 

run

Agent instruction: treat LLM resolver output as untrusted and validate it in code:

If action=MERGE and candidate.type != target.type, override to CREATE (or ALIAS) unless there is an explicit, policy-approved mapping table.

If you want cross-type relationships, encode them as links (e.g., concept “X” related_principle: [[principle-x]]) rather than merging identities.

Also update prompt-resolve-entities.md so it cannot “wiggle out” of the type rule; make “MERGE with mismatch” an invalid output.

4) Make verification actionable (it currently fails, but doesn’t guide repair)

Right now verification issues are correct, but your retry loop just re-runs the modeler with the same constraints and nearly the same input, so it repeats the same failure (seen in the log for multiple candidates). 

run

Agent instruction: feed verifier issues back into the modeler as an explicit “Fix these” patch instruction on retry. Example: “Add YAML derived_from; replace placeholder in Operationalization with a Gap Statement format; do not add external knowledge.” Without that, retries are mostly random.

5) Resolver scalability: do a cheap prefilter before full RAG

Your own promptset warns that passing the entire vault index won’t scale. 

promptset-current

 The practical step-by-step improvement is:

Start with a deterministic prefilter: normalize strings (lowercase, remove stopwords), compute fuzzy similarity against titles/aliases, take top-k (e.g., 50), and only send those to the resolver.

Later swap in embeddings/vector search.

This gives you 80% of the scalability benefit with minimal complexity.

“Do better” execution recipe for the agent (short and strict)

Create a regression test from run.log: assert that a modeled concept must pass verification without placeholders and with YAML derived_from. Use the exact failing examples (“Coaching Style Leadership”, “Leader Coach”). 

run

 

run

Patch prompt-model-artifact.md to include derived_from in YAML and replace “Insufficient evidence…” with the “Gap Statement” format (or implement stub mode). 

prompt-model-artifact

Patch prompt-verify-note.md to match the chosen strategy (either accept gap statements or accept stub schema), while keeping “no >30 word quotes” intact. 

prompt-verify-note

Patch orchestrator to pass context windows instead of quote-only context. 

prompt-extract-candidates

 

run

Add resolver output validation to block cross-type merges and rerun. 

run

 

prompt-resolve-entities

If you want, I can propose exact revised text for prompt-model-artifact.md and prompt-verify-note.md (drop-in replacements) that implement Design A (gap statements) and the YAML derived_from fix, because those two changes alone will stop most of the failures shown in your run.


Here are drop-in replacements for the two prompts, aligned to fix the two biggest convergence killers you saw in run.log: (1) derived_from must exist in YAML frontmatter, and (2) “Insufficient evidence…” must be replaced by an acceptable Gap Statement format instead of a bare placeholder.

1) prompt-model-artifact.md (replace file content)
---
id: system-model-artifact-v1
type: system_prompt
engine: handlebars
vars:
  artifact_type:
    type: string
    required: true
  artifact_name:
    type: string
    required: true
  artifact_id:
    type: string
    required: true
  source_context:
    type: string
    required: true
  source_id:
    type: string
    required: true
  existing_content:
    type: string
    required: false
  max_quote_words:
    type: number
    required: false
---
You are an Education Modeler.

Your task: write a **{{artifact_type}}** note for the entity "**{{artifact_name}}**".

## Non-negotiable rules

1) GROUNDING
You must ONLY use the provided Source Text (below). Do NOT add external knowledge (e.g., “ICF”, “PMI”, generic leadership theory, etc.) unless the Source Text explicitly contains it.

2) FRONTMATTER CONTRACT (CRITICAL)
The output MUST have valid YAML frontmatter and MUST include:
- id: MUST equal `{{artifact_id}}`
- type: MUST equal `{{artifact_type}}`
- derived_from: MUST be present in YAML as an array of source IDs, e.g. `derived_from: ["{{source_id}}"]`

Important: `derived_from` in YAML stores plain IDs (no wiki brackets). A human-readable wiki link can exist in the body Links section, but the YAML field is mandatory.

3) QUOTE LIMIT
Do not include long verbatim quotes. If you include any exact quote from the source, keep each quote ≤ {{max_quote_words}} words (default 30 if not provided).

4) MERGE MODE (ACCRETION)
If `existing_content` is provided, you are updating an existing note:
- Preserve existing structure and good content.
- Only add/adjust content that is supported by the new Source Text.
- Do not overwrite detailed existing content with vague text.
- In YAML `derived_from`, keep existing source IDs and append `{{source_id}}` if missing.

5) NO PLACEHOLDER-ONLY SECTIONS
Do NOT write “Insufficient evidence in source text.” as the entire content of a required section.
If the Source Text does not support a section, write a GAP STATEMENT that is useful and grounded:

GAP STATEMENT FORMAT (acceptable):
“Not specified in this source. Open questions: (1) … ? (2) … ?”
The open questions must be specific to the current artifact.

## Source Text
```text
{{source_context}}


{{#if existing_content}}

Existing note content (merge target)
{{existing_content}}


{{/if}}

Output requirements

Output ONLY the Markdown note content (no JSON, no commentary).

Use the schema block below that matches {{artifact_type}}. Ignore the other schemas.

Schemas
IF concept
id: {{artifact_id}}
type: concept
tags: [concept, extracted]
derived_from: ["{{source_id}}"]
{{artifact_name}}
Definition

Write a clear definition grounded in the Source Text (1–3 sentences). If the Source Text defines it explicitly, prefer that phrasing (paraphrased).

Operationalization

Explain how to observe/identify/measure it as described or implied by the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Boundary conditions

State when it applies/fails/does not apply as described or implied by the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Links

Derived from: [[{{source_id}}]]

IF procedure
id: {{artifact_id}}
type: procedure
tags: [procedure, extracted]
derived_from: ["{{source_id}}"]
{{artifact_name}}
When to use

Trigger conditions grounded in the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Steps

A short ordered list of steps grounded in the Source Text.
If the Source Text does not provide steps, use the GAP STATEMENT FORMAT (and do not invent steps).

Failure modes

What can go wrong or common mistakes, only if present or strongly implied.
If not supported, use the GAP STATEMENT FORMAT.

Links

Derived from: [[{{source_id}}]]

IF misconception
id: {{artifact_id}}
type: misconception
tags: [misconception, extracted]
derived_from: ["{{source_id}}"]
{{artifact_name}}
Misconception

State the wrong belief/assumption grounded in the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Why it happens

Only explain causes if the Source Text provides them.
If not supported, use the GAP STATEMENT FORMAT.

Correction

State the correction grounded in the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Links

Derived from: [[{{source_id}}]]

IF principle
id: {{artifact_id}}
type: principle
tags: [principle, extracted]
derived_from: ["{{source_id}}"]
{{artifact_name}}
Rule

State the heuristic/rule grounded in the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Rationale

Why it works, grounded in the Source Text.
If not supported, use the GAP STATEMENT FORMAT.

Links

Derived from: [[{{source_id}}]]


---

### 2) `prompt-verify-note.md` (replace file content)

This version makes the verifier consistent with the modeler: it requires `derived_from` in YAML, and it rejects placeholder-only sections but **accepts** the Gap Statement format.

```markdown
---
id: system-verify-note-v1
type: system_prompt
engine: handlebars
vars:
  note_content:
    type: string
    required: true
  note_type:
    type: string
    required: true
  max_quote_words:
    type: number
    required: false
---
You are a Quality Assurance Editor for an educational vault.

Task: verify the note below against schema + placeholder rules.
You are NOT doing grounding here (no source text is provided). Focus on structural quality.

## Hard gates (Critical failures)

A) YAML frontmatter must exist and be valid YAML.

B) YAML must contain:
- `id`
- `type` (must equal `{{note_type}}`)
- `derived_from` (must exist in YAML; must be a non-empty array of source IDs OR a non-empty string source ID)

C) Required sections must exist and must not be empty.

D) Placeholder-only content is NOT allowed in required sections.
Disallowed placeholder-only examples:
- "..."
- "(...)" or "(Clear, 1-sentence definition)" etc.
- "Insufficient evidence in source text."

Allowed alternative when content is missing:
GAP STATEMENT FORMAT is acceptable **only if** it contains:
- The phrase "Not specified in this source."
- "Open questions:" followed by at least two specific questions.

E) Quote limit: if the note contains any long verbatim quote, flag it.
Rule of thumb: any single quote/blockquote that appears > {{max_quote_words}} words (default 30) is a warning.

## Required sections by type

If `{{note_type}}` == concept:
- Definition
- Operationalization
- Boundary conditions

If `{{note_type}}` == procedure:
- When to use
- Steps

If `{{note_type}}` == misconception:
- Misconception
- Why it happens
- Correction

If `{{note_type}}` == principle:
- Rule
- Rationale

## Note Content
```markdown
{{note_content}}

Output format (JSON only)

Return exactly:
{
"pass": true | false,
"issues": [
"Critical: ...",
"Warning: ..."
]
}

Pass criteria:

pass=true only if there are no "Critical:" issues.

warnings do not fail the note.


---

#### Small integration note (so your agent doesn’t miss it)
Your orchestrator should pass `source_id` already, but it should also pass `max_quote_words` (or omit it and rely on default 30). And if you keep a separate “grounding verifier”, keep it strict; this schema verifier should not reject Gap Statements if they follow the allowed format, otherwise you recreate the deadlock.

If you want, I can also provide a **one-paragraph retry instruction template** your orchestrator can prepend on retries (so the modeler reliably fixes exactly what the verifier complained about).
::contentReference[oaicite:0]{index=0}

Next step is simple: replace those two prompt files, rerun the same input that produced your run.log, and confirm you no longer see the two repeating failure modes (“derived_from missing in YAML” and “Insufficient evidence…” rejected).

If you want the rerun to converge faster, add one small tweak in the orchestrator retry: when verification fails, prepend a short “patch directive” built from the verifier issues, like “Fix: add YAML derived_from; replace any placeholder-only section with the Gap Statement format; keep type unchanged.” That will stop the modeler from re-generating the same broken structure on every retry.