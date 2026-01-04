# Prompt Templates (file-oriented)

Date: 2026-01-03

These are templates you can use inside Volcano steps. They assume the agent can read/write files directly.

## 1) Extractor template

Goal: from an input chapter, create candidate modeled notes (not long summaries, no long quotes).

Inputs:
- Chapter file: <path>
- Source anchor note id: <id>
- Vault index: vault/_index/notes.json

Outputs:
- Staging notes: vault/_staging/*.md

Constraints:
- Each note must be atomic (one teachable idea).
- Use your own wording.
- If you detect implied prerequisites or missing criteria/definitions, list them under “Presuppositions” as candidate concept IDs (do not invent content).

## 2) Modeler template (DBM/NLP-style)

Goal: convert staging notes into canonical education artifacts.

Inputs:
- Staging notes folder
- Schema: docs/NOTE_TYPES_AND_LINKS.md

Outputs:
- Canonical notes in vault/{objectives,concepts,procedures,misconceptions,principles,...}

Objective rule:
- If the material implies a teachable capability, create or update one `learning_objective` note that can serve as the anchor for later content generation.

Constraints:
- For each concept/procedure, add:
  - operationalization (observable indicators)
  - boundary conditions (context limits)
  - one original example or mini-scenario (your own creation)
- Add `Derived from: [[source-...]]` link.
- Add at least one `Prerequisites:` or `Applies to:` link.

## 3) Linker + Stub resolver template

Goal: ensure all links resolve; create stubs.

Inputs:
- List of new/modified note paths
- Vault index

Outputs:
- Created stubs in vault/concepts/
- Updated notes with canonical IDs
- Link audit report

Rules:
- If a wikilink target does not exist, create `concept-<slug>.md` stub with `status: stub`.
- If a target matches an alias of an existing concept, rewrite the link to canonical ID.

## 4) Storyteller template (business fable pack)

Add-on outputs:
- Write a `storyboard` note for the story (beats → linked concepts/procedures/misconceptions).
- Write a `microlearning_unit` note containing 3–7 cards/steps.
- Ensure both link to exactly one primary objective note.

Goal: generate an original business fable grounded in selected vault notes.

Inputs:
- Objective: <text or note id>
- Retrieval set: <list of note ids> OR allow retrieval via index

Outputs:
- vault/stories/story-<id>.md

Constraints:
- Write an original story with a business-fable tone.
- After the story, add a facilitator appendix mapping 5–10 story beats to linked concepts/procedures/misconceptions.
- Include one activity and 3–5 assessment items aligned to the same objective.


## Prompt notes and rendering

In v0.3, prompts can be stored as vault notes under `vault/_system/prompts/` and rendered via `docs/PROMPT_CONTRACT.md`. Each Volcano step should load the prompt note by ID, validate the provided context, render it, and execute.

Recommended context keys:
- run_id, vault_dir
- inputs.files, inputs.source_anchor_id, inputs.objective_id
- outputs.staging_dir, outputs.index_dir
- retrieval_set, constraints
