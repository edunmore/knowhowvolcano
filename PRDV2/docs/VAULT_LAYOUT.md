# Vault Layout and Conventions

Date: 2026-01-03

## Folder conventions

- `vault/sources/` — provenance nodes (book/chapter/webinar)
- `vault/objectives/` — learning objectives (canonical join keys)
- `vault/concepts/` — canonical concepts, including stubs
- `vault/procedures/` — methods with steps
- `vault/principles/` — heuristics and decision rules
- `vault/misconceptions/` — error patterns + corrections
- `vault/examples/` — original cases and scenarios
- `vault/activities/` — practice exercises
- `vault/assessments/` — quiz/rubric items
- `vault/stories/` — generated business fables
- `vault/storyboards/` — storyboards mapped to objectives
- `vault/microlearning/` — microlearning units/cards mapped to objectives
- `vault/_system/` — system assets (prompts, promptsets, eval reports)
- `vault/_index/` — derived artifacts (rebuildable)

## Naming conventions

- Filenames must match frontmatter `id`.
- Concepts: `concept-<slug>.md`
- Procedures: `procedure-<slug>.md`
- Misconceptions: `misconception-<slug>.md`
- Sources: `source-<slug>.md`
- Objectives: `objective-<slug>.md`
- Storyboards: `storyboard-<objective>-NNN.md`
- Microlearning: `microlearning-<objective>-NNN.md`
- Stories: `story-<slug or objective>-NNN.md`

## Wikilinks

Prefer stable-id links:
- `[[concept-query-expansion]]`
Optionally add label:
- `[[concept-query-expansion|query expansion]]`

## Redirects (optional)

When merging concepts, either:
- update all links to the canonical ID, or
- create `concept-old-id.md` as a redirect stub that points to the canonical concept and marks `status: redirect`.


## Evaluation workspace (recommended)

Outside the vault or inside `vault/eval/` (choose one and stay consistent):

- `eval/corpus/` — representative inputs used for regression runs
- `eval/expectations/` — property-based expectations per corpus item (JSON)
- `eval/baselines/` — stored baseline metrics for comparison
