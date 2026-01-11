## 2. Type: source_anchor

Purpose: bibliographic provenance node.

Required sections:
- `Source`
- `Scope`
- `Notes` (optional)

Recommended frontmatter:
- `source_kind`: `book|chapter|paper|video|webinar|course`
- `citation`: object (author, year, publisher, etc.)
- `location`: object (chapter, pages, timestamp range)
- `input_files`: string[] (paths or vault-relative handles)


## 4. Type: learning_objective

Purpose: canonical learning objective (the primary join key for generation).

Required sections:
- `Definition` (observable performance)
- `Mastery criteria` (how you know it was achieved)
- `Common misconceptions` (what learners get wrong)
- `Links`

Recommended frontmatter:
- `level`: e.g., remember/understand/apply/analyze/evaluate/create (or your own scale)
- `verbs`: string[] (observable verbs)
- `assessment_modes`: string[] (mcq, short-answer, rubric, roleplay)


## 4. Type: concept

Purpose: canonical explanation node.

Required sections:
- `Definition`
- `Why it matters`
- `Operationalization` (how you observe/measure it)
- `Boundary conditions` (when it fails / context limits)
- `Links` (typed links, or just wikilinks)

Stub rules:
- `status: stub`
- must contain only: a scope statement, open questions, and optional one working hypothesis.

## 5. Type: procedure

Purpose: teachable method (steps).

Required sections:
- `When to use`
- `Inputs`
- `Steps`
- `Outputs`
- `Failure modes`
- `Links`

## 6. Type: principle

Purpose: heuristic / decision rule.

Required sections:
- `Rule`
- `Rationale`
- `Trade-offs`
- `Examples`
- `Links`

## 7. Type: misconception

Purpose: common error + correction.

Required sections:
- `Misconception`
- `Why it happens`
- `Correction`
- `Quick check` (how to detect in learners)
- `Links`

## 8. Type: example_case

Purpose: original scenario or case.

Required sections:
- `Context`
- `Characters/roles`
- `Situation`
- `Resolution options`
- `Teaching points`
- `Links`

## 9. Type: activity

Purpose: practice exercise / workshop segment.

Required sections:
- `Objective`
- `Materials`
- `Instructions`
- `Timing`
- `Facilitation notes`
- `Debrief questions`
- `Links`

## 10. Type: assessment_item

Purpose: quiz/rubric item.

Required sections:
- `Prompt`
- `Answer key`
- `Rationale`
- `Common wrong answers`
- `Links`

## 11. Type: story

Purpose: business fable + facilitator appendix.

Required sections:
- `Story`
- `Facilitator appendix` (story beats → concepts/procedures/misconceptions)
- `Activity`
- `Assessment items`
- `Links`

## 12. Link categories (recommended vocabulary)

- `derived_from`: modeled note → source_anchor
- `prerequisite`: A → B
- `part_of`: component → system
- `applies_to`: concept/procedure → example/activity/story
- `contrasts_with`: alternative lenses
- `supports_objective`: alignment
- `practices_objective`: practice artifact → objective
- `primary_objective`: content artifact → objective (exactly one primary)
- `assesses`: assessment → objective/concept
- `addresses_misconception`: misconception → concept/objective

Implementation note: in Markdown, keep a final section like:

```md
## Links
Derived from: [[source-...]]
Prerequisites: [[concept-...]]
Contrasts with: [[concept-...]]
Applies to: [[example-...]]
```

Your indexer can parse these headings/labels and emit typed edges.


## 12. Type: storyboard

Purpose: a beat-by-beat plan that maps narrative beats to teaching intent.

Required sections:
- `Objective` (link to exactly one primary objective)
- `Beats` (numbered; each beat links to concepts/procedures/misconceptions)
- `Assets to generate` (slides/cards/roleplays)
- `Links`

## 13. Type: microlearning_unit

Purpose: a compact microlearning pack (cards/steps) linked to one objective.

Required sections:
- `Objective` (link to exactly one primary objective)
- `Hook`
- `Core idea`
- `Quick check`
- `Tiny practice`
- `Links`


## System note types (recommended)

### Type: system_prompt

Purpose: a versioned prompt template stored in the vault.

Required frontmatter:
- `engine`: templating engine name (e.g., handlebars)
- `vars`: typed variable declarations required to render the prompt

Required sections:
- prompt body (template text)

Recommended links:
- `governs`: which note types or workflows this prompt is responsible for
- `evaluated_by`: eval report notes

### Type: promptset

Purpose: a pinned set of prompt IDs used by the pipeline (“release”).

Required sections:
- mapping of step names → prompt IDs
- evaluation status (current/candidate/retired)

### Type: eval_report

Purpose: evaluation and regression report for a promptset.

Required sections:
- corpus used
- metrics summary
- pass/fail gate results
- linked issues and proposed fixes

### Type: failure_pattern (optional)

Purpose: a named recurring failure linked to detectors, affected prompts, and fixes.
