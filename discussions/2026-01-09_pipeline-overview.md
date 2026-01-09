# vNext Pipeline Overview

> **Created**: 2026-01-09  
> **Context**: Canon Extraction Pipeline - Full Flow Description  
> **Based on**: Benchmark run `run-2026-01-09-1259`

This document describes the full pipeline flow **without code samples** - just what happens at each step, what goes in, what comes out.

---

## Pipeline at a Glance

| Step | Name | Purpose | LLM Used |
|------|------|---------|----------|
| 1 | **ingest** | Store raw source file | None |
| 2 | **chunk** | Split into processable pieces | None |
| 3 | **gate** | Classify chunks for processing | None (fast mode) |
| 4 | **model_bundle** | Extract + Model + Verify notes | DeepSeek |
| 5 | **verify** | Double-check note quality | DeepSeek (skipped if inline) |
| 6 | **link** | Resolve links, create stubs | GPT-5-nano |
| 7 | **emit_candidates** | Collect link intents | None |
| 8 | **emergent_artifacts** | Create MOCs, bridges, trails | DeepSeek |
| 9 | **index** | Build graph and backlinks | None |

**Total runtime**: ~2 minutes for 4.7kb source

---

## Detailed Step Flow

### Step 1: Ingest

**What it does**: Stores the raw source file in the vault without modification.

| | |
|---|---|
| **Input** | Source file (e.g., `benchmark_source_nohints.md`) |
| **Output** | `_sources/source-{name}-{hash}/raw.md` |
| **Prompt** | None |
| **LLM** | None |

**Example from benchmark:**
- Input: `benchmark_source_nohints.md` (4.7kb)
- Output: `_sources/source-benchmark-source-nohints-38e4b47a/raw.md`
- Also creates: `sources/source-benchmark-source-nohints-38e4b47a.md` (anchor note)

---

### Step 2: Chunk

**What it does**: Splits the source into semantic chunks based on headings. Each chunk is small enough to fit in an LLM context window.

| | |
|---|---|
| **Input** | Raw source from Step 1 |
| **Output** | `_sources/src_{hash}/chunks/000000.md`, `000001.md`, etc. |
| **Prompt** | None |
| **LLM** | None |

**Example from benchmark:**
- Input: 4,727 characters
- Output: 2 chunks in `_sources/src_38e4b47a40f0/chunks/`
- Also creates: `manifest.json` with chunk metadata

---

### Step 3: Gate

**What it does**: Classifies each chunk as FULL_MODEL, SUMMARY_ONLY, or SKIP based on content richness. In "fast mode" (source < 10kb), all chunks are marked FULL_MODEL.

| | |
|---|---|
| **Input** | Chunks from Step 2 |
| **Output** | Updated `manifest.json` with classifications |
| **Prompt** | `prompt-chunk-gate.md` (not used in fast mode) |
| **LLM** | DeepSeek (not used in fast mode) |

**Example from benchmark:**
- Fast mode activated (source < 10kb)
- All 2 chunks → FULL_MODEL

---

### Step 4: Model Bundle (Main Processing)

**What it does**: The core step. For each chunk window:
1. **Extract** candidates (concepts, principles, procedures, misconceptions)
2. Check for **duplicates** using embedding search
3. **Model** each candidate into a structured note
4. **Verify** the note immediately

| | |
|---|---|
| **Input** | Chunks classified as FULL_MODEL |
| **Output** | Notes in `concepts/`, `principles/`, `procedures/`, `misconceptions/`, `examples/` |
| **Prompts** | `prompt-extract-candidates.md`, `prompt-model-artifact.md`, `prompt-verify-note.md` |
| **LLM** | DeepSeek (extract, model, verify) |

**Deduplication flow:**
1. Generate keywords from candidate name + reason + quote
2. Search vector store for similar existing notes
3. If similarity > 0.9 → auto-skip (merge candidate)
4. If similarity 0.7-0.9 → LLM verification (GPT-5-nano asks "same concept?")
5. If similarity < 0.7 → create new note

**Example from benchmark:**
- Window 1: Extracted 8 candidates → Created 5 notes
- Window 2: Extracted 6 candidates → Created 5 notes (some skipped as duplicates)
- Total: 10 notes created, 100% verification pass rate

**Notes created:**
| Type | Count | Examples |
|------|-------|----------|
| Concepts | 3 | Outcome Ladder, Friction Budget, Calibration Loop |
| Principles | 3 | Two-Speed Feedback, Spend Friction Where It Buys Transfer |
| Procedures | 1 | 7-Minute Microlearning Loop |
| Misconceptions | 2 | More Content Means More Learning |
| Examples | 1 | Manager's Response to Missed Deadlines |

---

### Step 5: Verify

**What it does**: Validates that each note follows the required structure and is properly grounded in source material.

| | |
|---|---|
| **Input** | All notes created in Step 4 |
| **Output** | `verified: true` in frontmatter (or verification issues logged) |
| **Prompt** | `prompt-verify-note.md` |
| **LLM** | DeepSeek |

**Example from benchmark:**
- 10 notes verified
- 10 skipped (already verified inline in model_bundle)
- Pass rate: 100%

> Since model_bundle verifies inline, this step often just confirms what was already done.

---

### Step 6: Link

**What it does**: Resolves `[[wikilinks]]` in notes and creates stub notes for missing concepts.

| | |
|---|---|
| **Input** | Notes with LINK_INTENTS in frontmatter |
| **Output** | Stubs in `stubs/` folder |
| **Prompt** | `prompt-create-stub.md` |
| **LLM** | GPT-5-nano (for stub creation) |

**Resolution flow:**
1. Collect all unique link targets from notes
2. For each target:
   - Check exact filename match → done
   - Check semantic match using embeddings → done if > 70% similar
   - Create stub if no match found

**Example from benchmark:**
- 11 unique link targets to check
- 5 exact matches (e.g., "Two-Speed Feedback" → `two-speed-feedback.md`)
- 1 semantic match ("The Outcome Ladder" → `outcome-ladder.md` at 79%)
- 5 stubs created (deliberate practice, interference, stable concept, prerequisite, transfer)

**Stubs created:**
| Stub | Reason |
|------|--------|
| `stub--deliberate-practice.md` | Referenced but not extracted |
| `stub--interference.md` | Referenced but not extracted |
| `stub--stable-concept.md` | Referenced but not extracted |
| `stub--prerequisite.md` | Referenced but not extracted |
| `stub--transfer-learning-outcome.md` | Referenced but not extracted |

---

### Step 7: Emit Candidates

**What it does**: Collects LINK_INTENTS from all notes for potential future processing.

| | |
|---|---|
| **Input** | All notes with LINK_INTENTS |
| **Output** | Aggregated link candidates (if any unresolved) |
| **Prompt** | None |
| **LLM** | None |

**Example from benchmark:**
- Processed 10 notes
- Found 0 remaining link candidates (all resolved in Step 6)

---

### Step 8: Emergent Artifacts

**What it does**: Creates higher-level navigation and synthesis artifacts:
- **MOCs** (Maps of Content): Index pages for a source's concepts
- **Trails**: Learning paths through related concepts
- **Bridges**: Notes connecting two related concepts

| | |
|---|---|
| **Input** | All notes from the source |
| **Output** | `slipbox/mocs/`, `slipbox/trails/`, `slipbox/bridges/` |
| **Prompt** | (internal bridge prompt) |
| **LLM** | DeepSeek (for bridge notes) |

**Example from benchmark:**
- 1 MOC: `moc-38e4b47a40f0.md`
- 1 Trail: `trail-38e4b47a40f0.md`
- 1 Bridge: `bridge-outcome-ladder-7-minute-microlearning-loop.md`

---

### Step 9: Index

**What it does**: Builds the knowledge graph and generates backlinks.

| | |
|---|---|
| **Input** | All notes in vault |
| **Output** | `_index/notes.json`, `_index/backlinks.json` |
| **Prompt** | None |
| **LLM** | None |

**Example from benchmark:**
- Indexed 19 notes (includes stubs and emergent artifacts)
- Generated backlinks for cross-navigation

---

## Final Vault Structure

After pipeline completion:

```
benchmark/run-2026-01-09-1259/
├── _index/
│   ├── vectors.db          (embedding database)
│   ├── notes.json          (note metadata)
│   └── backlinks.json      (link graph)
├── _sources/
│   └── src_38e4b47a40f0/   (chunks)
├── concepts/               (3 notes)
├── principles/             (3 notes)
├── procedures/             (1 note)
├── misconceptions/         (2 notes)
├── examples/               (1 note)
├── stubs/                  (5 stubs)
├── slipbox/
│   ├── bridges/            (1 bridge)
│   ├── mocs/               (1 MOC)
│   └── trails/             (1 trail)
└── sources/                (1 source anchor)
```

---

## Pipeline Prompts Reference

| Prompt | Used In | Purpose |
|--------|---------|---------|
| `prompt-extract-candidates.md` | model_bundle | Find concepts in source text |
| `prompt-model-artifact.md` | model_bundle | Structure note with sections |
| `prompt-verify-note.md` | model_bundle, verify | Check note quality |
| `prompt-create-stub.md` | link | Generate placeholder notes |
| `prompt-chunk-gate.md` | gate | Classify chunk richness |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Source size | 4.7kb |
| Chunks created | 2 |
| Notes extracted | 10 |
| Stubs created | 5 |
| Semantic matches (dedup) | 1 |
| Exact matches | 5 |
| MOCs | 1 |
| Bridges | 1 |
| Trails | 1 |
| Total indexed | 19 |
| Runtime | ~2 minutes |

---

## Questions?

Add your questions here with **Q:** prefix.

