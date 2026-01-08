---
id: promptset-current
type: promptset
title: Promptset — Current System Prompts
created: 2026-01-04
status: active
---

# Prompt Architecture Overview

This document defines the active prompts driving the Knowledge Extraction Pipeline. Each prompt has a specific functional goal within the cognitive architecture.

## Phase 1: Ingestion
### [prompt-ingest.md](../prompts/prompt-ingest.md)
*   **Goal**: Create a `source_anchor` note from a raw file.
*   **Intent**: Establish a pristine, non-hallucinated record of the file's existence, metadata, and path before any processing occurs.
*   **Input**: `file_name`, `content_preview` (First 2000 chars).
*   **Execution**: Once per File.
*   **Side Effects**: **[WRITE]** Creates `source-*.md`.
*   **Outcome**: Raw YAML frontmatter (ID, Title, Path).

## Phase 2: Discovery & Extraction
### [prompt-extract-candidates.md](../prompts/prompt-extract-candidates.md)
*   **Goal**: Identify atomic "Knowledge Candidates" (Concepts, Principles, Procedures) from the source text.
*   **Intent**: Act as a high-pass filter to separate signal (teachable artifacts) from noise.
*   **Input**: `source_text` (Full file content).
*   **Execution**: Once per File.
*   **Side Effects**: [READ-ONLY] No changes to vault.
*   **Outcome**: JSON List of objects `{ name, type, quote, reason }`.

### [prompt-resolve-entities.md](../prompts/prompt-resolve-entities.md)
*   **Goal**: Deduplicate new candidates against the existing Vault Index.
*   **Intent**: Enforce **Entity Resolution** to prevent duplicate notes.
*   **Input**: `candidates_list` (JSON from Extractor), `vault_index` (List of existing Note IDs/Titles).
*   **Execution**: Once per File (Batch processing of all candidates).
*   **Side Effects**: [READ-ONLY] No changes to vault.
*   **Outcome**: JSON Resolution Map `{ "Candidate Name": "existing-id" | "CREATE" }`.
> [!WARNING]
> **Scalability Limit**: This prompt receives the *entire* Vault Index as context. For vaults >1000 notes, this will hit context window limits. Future optimization: Implement RAG/Vector Search to supply only the top-50 most relevant existing nodes.

## Phase 3: Modeling (Synthesis)
### [prompt-model-artifact.md](../prompts/prompt-model-artifact.md)
*   **Goal**: Write the structured Markdown note for a single concept/principle.
*   **Intent**: Transform raw text into a pedagogical artifact. Enforces **Strict Grounding** and **Accretion**.
*   **Input**: `artifact_name`, `artifact_type`, `context_quote` (Excerpt/Evidence from Extractor), `source_id`, `existing_content`.
*   **Execution**: **Per Candidate** (Iterates through the Resolution List).
*   **Side Effects**: **[WRITE]** Creates or Updates `concept-*.md`.
*   **Outcome**: Valid Markdown Note with Schema-compliant YAML and content.

## Phase 4: Quality Assurance
### [prompt-verify-note.md](../prompts/prompt-verify-note.md)
*   **Goal**: Validate the structural integrity of a generated note.
*   **Intent**: Catch syntax errors, invalid YAML, or missing schema fields (System Verification).
*   **Input**: `note_content` (Full Markdown), `note_type`.
*   **Execution**: **Per Candidate** (Immediately after Modeling).
*   **Side Effects**: [READ-ONLY].
*   **Outcome**: JSON `{ pass: boolean, issues: [] }`.

### [prompt-verify-grounding.md](../prompts/prompt-verify-grounding.md)
*   **Goal**: Audit the content against the original Source Text.
*   **Intent**: Detect **Hallucinations**. Checks if claims are supported by source.
*   **Input**: `source_text` (Full Source Content), `note_content` (Derivative Note).
*   **Execution**: **Per Candidate** (Conditional: only if source info available).
*   **Side Effects**: [READ-ONLY] (Fails the pipeline, triggers retry loop, but does not write to vault itself).
*   **Outcome**: JSON `{ pass: boolean, issues: [] }`.

## Phase 5: Graph Maintenance
### [prompt-create-stub.md](../prompts/prompt-create-stub.md)
*   **Goal**: Create a placeholder note for a broken Wikilink.
*   **Intent**: Ensure graph connectivity for missing targets.
*   **Input**: `concept_name` (Missing Link Target), `context_usage` (~100 chars surrounding text).
*   **Execution**: Per Broken Link (Batch loop).
*   **Side Effects**: **[WRITE]** Creates `concept-*.md` (Stub).
*   **Outcome**: Minimal Markdown Note.

## Phase 6: Extension
### [prompt-storyteller-v1.md](../prompts/prompt-storyteller-v1.md)
*   **Goal**: Translate an abstract concept into a concrete narrative or business fable.
*   **Intent**: Provide a "Story" view of the "Concept" view.
*   **Input**: `objective_name` (Canonical Title), `related_concepts_list` (Subset of Vault Index).
*   **Execution**: Once per Primary Concept (Usually the "Main Topic" of the file).
*   **Side Effects**: **[WRITE]** Creates `story-*.md`.
*   **Outcome**: Markdown Story Note linked to the Concept.
