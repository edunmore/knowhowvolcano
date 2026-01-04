# FULLDOCV2: Research System Status & Audit Report
**Date**: 2026-01-04
**Status**: MVP Implementation (Functionally Complete but Flawed)

## 1. Executive Summary
The system successfully implements the full "Ingest -> Extact -> Model -> Link" pipeline defined in PRD V2. It is capable of end-to-end autonomous runs.
However, a **Critical Architectural Flaw** was identified in the **Modeling Phase**: The Modeler agent receives *only* the extracted quote (1-2 sentences) rather than the surrounding context. This practically guarantees hallucination or "insufficient evidence" failures, as the agent cannot see the full definition or operational context of the concept it is trying to model.

---

## 2. Identified Critical Flaws

### Flaw #1: Modeler Context Starvation
*   **Description**: The `Orchestrator` passes `candidate.quote` to the `Modeler` instead of `source_text` or a `context_window`.
*   **Impact**: The Modeler tries to write detailed sections (Operationalization, Boundary Conditions) based on a single sentence. It has to guess (hallucinate) or fail.
*   **Fix Required**: Update `Extractor` to return a `location_index` (or character offset). Update `Orchestrator` to slice the original source text (e.g., +/- 2000 chars) around that index and pass *that* to the Modeler.

### Flaw #2: Resolver Scalability
*   **Description**: The `Resolver` prompt receives the *entire* Vault Index list.
*   **Impact**: Works for <100 notes. Will crash (Context Limit Exceeded) for >1000 notes.
*   **Fix Required**: Implement Vector Search / RAG to retrieve only top-k similar candidates.

---

## 3. Current System Architecture (The Loop)

### Step 1: Ingestion
*   **Agent**: `Ingestor`
*   **Prompt**: `prompt-ingest.md`
*   **Input**: Raw File (Start), Filename.
*   **Outcome**: Creates `source-book-name.md` (Anchor).
*   **Sample Output**:
    ```yaml
    id: source-leading-for-performance
    title: Leading for Performance
    ```

### Step 2: Extraction
*   **Agent**: `Extractor`
*   **Prompt**: `prompt-extract-candidates.md`
*   **Input**: Full Source Text.
*   **Outcome**: List of Candidates.
*   **Sample Output**:
    ```json
    [
      { "name": "GROW Model", "type": "concept", "quote": "The GROW model stands for Goal, Reality..." }
    ]
    ```

### Step 3: Resolution
*   **Agent**: `Resolver`
*   **Prompt**: `prompt-resolve-entities.md`
*   **Input**: Full List of Candidates + Full Vault Index.
*   **Outcome**: Map of Actions.
*   **Sample Output**:
    ```json
    [ { "candidate_name": "GROW Model", "action": "MERGE", "target_id": "concept-grow-model" } ]
    ```

### Step 4: Modeling (THE FLAWED STEP)
*   **Agent**: `Modeler`
*   **Prompt**: `prompt-model-artifact.md`
*   **Input**: `candidate.quote` (**Too Small!**).
*   **Outcome**: Markdown Concept Note.
*   **Sample Prompt Payload (Current)**:
    > You are an Education Modeler...
    > **Context**: "The GROW model stands for Goal, Reality..." (Just one line)

### Step 5: Verification
*   **Agent**: `Verifier`
*   **Prompt A**: `prompt-verify-note.md` (Schema Check).
*   **Prompt B**: `prompt-verify-grounding.md` (Grounding Check).
*   **Input**: Full Source Text + Generated Note.
*   **Outcome**: Pass/Fail. The Grounding check currently saves us by rejecting the hallucinated nonsense caused by Step 4.

---

## 4. Prompts Inventory (Current)
All prompts are located in `src/systems/research/vault/_system/prompts/`.

| Prompt | Function | Status |
| :--- | :--- | :--- |
| `prompt-ingest.md` | Create Source Anchor | OK |
| `prompt-extract-candidates.md` | Identify Concepts | OK |
| `prompt-resolve-entities.md` | Deduplication | **Warning: Scalability** |
| `prompt-model-artifact.md` | Write Concept Note | **Critical: Context Starvation** |
| `prompt-verify-note.md` | Check Syntax | OK |
| `prompt-verify-grounding.md` | Check Hallucination | Vital (Safety Net) |
| `prompt-create-stub.md` | Fix Dead Links | OK |
| `prompt-storyteller-v1.md` | Write Fables | OK |

## 5. Next Session Priorities
1.  **Refactor Context Passing**: Change `Extractor` to return location data. Change `Orchestrator` to pass full context (or window) to `Modeler`.
2.  **RAG Implementation**: Fix Resolver scalability.
