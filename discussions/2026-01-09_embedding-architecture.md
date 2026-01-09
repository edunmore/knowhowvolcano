# Embedding Architecture: Current Implementation & Status

> **Created**: 2026-01-09  
> **Context**: Canon Extraction Pipeline - Embedding System  
> **Related**: [vnext-pipeline-flow](file:///home/mac/projects/knowhow1/discussions/2026-01-08_vnext-pipeline-flow.md)

This document explains **how embeddings work in the pipeline today**, what was implemented in Phase 1, and what's planned next.

---

## Quick Summary

| Component | Status | Where |
|-----------|--------|-------|
| Embedding Provider | ✅ Done | [azure-embedding-provider.ts](file:///home/mac/projects/knowhow1/src/core/providers/azure-embedding-provider.ts) |
| Vector Store | ✅ Done | [vector-store.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/vector-store.ts) |
| Dedup Before Modeling | ✅ Done | [step-executors.ts](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts) (line ~627) |
| Dedup Before Stubs | ✅ Done | [linker.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/linker.ts) (line ~183) |
| Legacy JSON Index | 🟡 Deprecated | [note-embedding-index.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/note-embedding-index.ts) |

---

## How Embeddings Work NOW

### 1. Embedding Provider (`azure-embedding-provider.ts`)

Uses **Azure embed-v-4-0** model (1536 dimensions):

```typescript
// Creating the provider
const embedder = createAzureEmbedding();

// Get embedding for text
const embedding = await embedder.embedOne("friction budget coaching");
// Returns: number[1536]

// Compare two embeddings
const similarity = embedder.cosineSimilarity(embedding1, embedding2);
// Returns: 0.0 to 1.0
```

**Configuration:**
- Endpoint: `https://aineu-marcus.cognitiveservices.azure.com/openai/v1/`
- Model: `embed-v-4-0`
- Dimensions: 1536
- API key from: `api-keys.json`

---

### 2. Vector Store (`vector-store.ts`)

SQLite-based vector database using **sqlite-vec** extension:

```
_index/vectors.db
├── notes table      (id, title, type, embedding_keys, file_path)
└── note_vectors     (note_id, embedding[1536])
```

**Key Operations:**

```typescript
const vectorStore = new VectorStore(vaultDir);

// Index all notes in vault
await vectorStore.indexVault(logger);

// Search for similar notes
const matches = await vectorStore.searchSimilar(queryEmbedding, topK=5, threshold=0.7);
// Returns: [{ id, title, similarity, filePath }]

// Find existing match for a concept
const match = await vectorStore.findExistingMatch(
    "Feedback Loop",           // target title
    ["feedback", "iteration"], // embedding_match_keys
    0.7                        // threshold
);
```

**What gets embedded?** The `embedding_keys` from note frontmatter:
```yaml
embedding_keys: ["friction", "limited resource", "deliberate allocation", "budget"]
```

---

### 3. Deduplication BEFORE Modeling

In `model_bundle` step ([step-executors.ts](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts) lines 573-640):

```
For each extracted candidate:
  1. Check if note already exists by filename → skip if yes
  2. Generate keywords from candidate name
  3. Query vector store: findExistingMatch(name, keywords, 0.7)
  4. If match found with >70% similarity → SKIP (don't model)
  5. Else → proceed to model
```


Q: So the keywords are generated externally and not by the full modeller? Meaning we do not really have context, have we? Just a filename???

**A:** Yes, this is a **GAP**! Currently in `model_bundle`, we generate keywords by splitting the candidate name:
```typescript
const keywords = candidate.name.toLowerCase().split(/[\s-]+/).filter(w => w.length > 2);
```
So "Outcome Ladder" → `["outcome", "ladder"]`. Just title words, no semantic context.

**What's MISSING:** The extractor DOES output a `reason` field with context, but we don't use it for embedding search. We should:
1. Use `reason` field as additional embedding context
2. Or: pre-run a cheap embedding on `candidate.name + candidate.quote` before searching
3. Or: have the extractor output `embedding_match_keys` like the modeler does for LINK_INTENTS

This is **Phase 1 incomplete work** - not Phase 2.


**Example log output:**
```
[ModelBundle] Dedup: "Outcome Ladder" similar to "The Outcome Ladder" (89%) - skipping
```

**Configurable via runbook:**
```yaml
- id: model_bundle
  type: model_bundle
  inputs:
    dedup_threshold: 0.7    # Similarity threshold (default 0.7)
    dedup_top_k: 3          # How many candidates to check
```

Q: Why 0.7 threshold?

**A:** It's a balance. Too high (0.9+) misses legitimate duplicates like "Feedback Loop" vs "The Feedback Loop". Too low (0.5) catches unrelated concepts. 0.7 seemed reasonable from testing but **this likely needs tuning** - see TODO item "Tune threshold (0.7 may be too low/high)".


Q: what happens if we are larger then 0.7? Do we check if the duplicate candidates (it can be more than one) are real duplicates? Or we just say - there is something what could be and done?

**A:** Currently we just SKIP if >0.7. No verification, no merge, no link. This is **WRONG**. Here's what should happen:

```
For each candidate:
  1. Find all matches with similarity > 0.5
  2. If best match > 0.9: HIGH confidence → auto-merge content
  3. If best match 0.7-0.9: MEDIUM confidence → LLM verification
     - Ask: "Are these the same concept? A: 'Outcome Ladder' B: 'The Outcome Ladder'"
     - If yes: merge + link
     - If no: create new + possibly link as related
  4. If all matches < 0.7: LOW confidence → create new
```

**Self-learning threshold:** Your idea is good! Track:
- How many false positives (merged things that shouldn't be)
- How many false negatives (created duplicates that exist)
- Adjust threshold per vault based on history

---

Q: how do we handle linking then? If duplicate found that means we need to link...

**A:** Currently: we don't! When we skip a duplicate, we just... skip. No link created. This is a **BUG**.

**Correct behavior:**
```
If duplicate found:
  1. Don't create new note
  2. Find where the candidate was referenced in the source
  3. Create a link: [[existing-note-id]] 
  4. Optionally: update existing note with new context from source
```

This is what makes it a real Zettelkasten - connections, not just dedup.

---

Remark: not sure if this comments or question are really are the right place :) - the documentation is not clear enough for me where we are in the pipeline...

**A:** Valid point! Let me add a **Pipeline Position Marker** to each section. The dedup-before-modeling happens in:
```
Pipeline Step 4: model_bundle
  └── Before calling runModeler() for each candidate
```

I'll add a separate **Phase 1 Completion Plan** at the end of this document that shows exactly what's missing.


---

### 4. Deduplication BEFORE Stub Creation

In `linker.ts` ([line 182-194](file:///home/mac/projects/knowhow1/src/systems/research/agents/linker.ts#L182-194)):

```typescript
// For each link intent that wants a stub:
if (intent.embeddingMatchKeys.length > 0) {
    const match = await vectorStore.findExistingMatch(
        intent.targetTitle,
        intent.embeddingMatchKeys,
        0.7  // threshold
    );

    if (match) {
        logger.log(`Semantic match: "${intent.targetTitle}" → ${match.match.title} (${similarity}%)`);
        continue;  // Skip stub creation
    }
}
```

**Where do `embedding_match_keys` come from?**

The modeler outputs them in `LINK_INTENTS`:
```json
{
  "note_id": "outcome-ladder",
  "link_intents": [
    {
      "target_title": "Deliberate Practice",
      "embedding_match_keys": ["practice", "skill", "deliberate", "repetition"],
      "reason": "Related training concept"
    }
  ]
}
```

These keys make embedding search **much more accurate** than just using the title words.

Q: So the modeler decides what keys to use for matching?

**A:** Yes! The modeler (via `prompt-model-artifact.md`) is instructed to provide `embedding_match_keys` for each link intent. This is important because:
- "Transfer (Learning)" might have keys `["transfer", "generalization", "learning", "apply"]`
- Just using title words would give `["transfer", "learning"]` - less semantic richness
- The LLM understands **what the concept means** and picks better matching keywords

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     EMBEDDING DATA FLOW                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐     │
│  │ Note Created │────▶│ Extract          │────▶│ Azure embed-v-4-0│     │
│  │ with YAML   │     │ embedding_keys   │     │ API call         │     │
│  └─────────────┘     └──────────────────┘     └────────┬─────────┘     │
│                                                         │               │
│                                                         ▼               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    _index/vectors.db                             │   │
│  │  ┌───────────────────────────┐  ┌────────────────────────────┐  │   │
│  │  │ notes                     │  │ note_vectors (sqlite-vec)  │  │   │
│  │  │ ├─ id: friction-budget    │  │ ├─ note_id: friction-budget│  │   │
│  │  │ ├─ title: Friction Budget │  │ └─ embedding: FLOAT[1536]  │  │   │
│  │  │ └─ embedding_keys: [...]  │  │                            │  │   │
│  │  └───────────────────────────┘  └────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                     │                                   │
│                                     ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                  DEDUP CHECK (2 places)                        │    │
│  │                                                                 │    │
│  │  ┌──────────────────────┐     ┌──────────────────────────────┐ │    │
│  │  │ Before Modeling      │     │ Before Stub Creation         │ │    │
│  │  │ (model_bundle step)  │     │ (linker agent)               │ │    │
│  │  │                      │     │                              │ │    │
│  │  │ Keywords from name   │     │ embedding_match_keys from    │ │    │
│  │  │ → search → skip if   │     │ LINK_INTENTS → search →     │ │    │
│  │  │ similarity > 0.7     │     │ skip if similarity > 0.7    │ │    │
│  │  └──────────────────────┘     └──────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 - What Was Implemented ✅

All of these are **DONE** as of Jan 8, 2026:

| Item | Description | Files Changed |
|------|-------------|---------------|
| Azure embed-v-4-0 provider | OpenAI-compatible embedding API wrapper | `azure-embedding-provider.ts` |
| SQLite-vec vector store | Persistent vector DB at `_index/vectors.db` | `vector-store.ts` |
| Dedup before modeling | Check for similar notes before creating new ones | `step-executors.ts` |
| Dedup before stubs | Check for similar notes before creating stubs | `linker.ts` |
| Configurable threshold | `dedup_threshold` and `dedup_top_k` in runbook | `step-executors.ts` |
| `embedding_keys` in notes | 3-5 semantic keywords in frontmatter | `prompt-model-artifact.md` |
| `embedding_match_keys` in links | Keywords for link resolution | `prompt-model-artifact.md` |

**What WASN'T done in Phase 1 (should be!):**

| Item | Priority | Reason |
|------|----------|--------|
| LLM verification of ambiguous matches (0.7-0.9) | **HIGH** | Currently just skips - loses connections |
| Link creation when duplicate found | **HIGH** | No link = broken Zettelkasten |
| Better embedding context for candidates | **HIGH** | Just using title words is weak |
| Indexing stubs with embedding keys | MEDIUM | Stubs can't be found by semantic search |
| Batch embedding calls | LOW | Optimization, not functionality |
| Cross-run embedding cache | LOW | Optimization, not functionality |

R: See my comment above

**A:** Agreed! I'm adding these to the **Phase 1 Completion Plan** below.

---

R: so we have a more or less proof of concept now. We have a working sqlite vector store and we can use it. But we do not really use it the way it should be.

**A:** 100% correct. Current status:
- ✅ Vector store works
- ✅ Can index notes
- ✅ Can search similar
- ❌ Search results don't trigger smart actions (link/merge)
- ❌ Candidate keywords are too weak
- ❌ Stubs aren't indexed at all

---

R: This is high prio to finish Phase 1. If we do embedding, we need to do it right and complete.

**A:** Agreed. See **Phase 1 Completion Plan** below for the concrete steps.

---

R: Keep a note, that we have to have a general discussion/analyse if sqlite as db should be leveraged for more tasks in the vault...

**A:** Great point! SQLite potential:

| Use Case | Current | SQLite Option |
|----------|---------|---------------|
| Embeddings | ✅ sqlite-vec | Already done |
| Backlinks index | JSON file | Could be SQLite |
| Full-text search | None | FTS5 extension |
| Note metadata | YAML frontmatter | Duplicate in SQLite? |
| Relationships graph | JSON | SQLite relations |

**Trade-offs:**
- Pro: Fast queries, single source of truth, transactions
- Con: Notes no longer plain markdown, need viewer app

**Recommendation:** For Phase 1, keep notes as markdown + use SQLite as INDEX only. Don't move content to SQLite yet - that's a bigger architectural decision for Phase 3.

Adding this to the future discussion topics.




---

## ⚠️ IMPORTANT: Phase Clarification

R: So this is not the real Phase 2 - more a embedding phase 2 - see my comment above.

**A:** You're RIGHT! The TODO.md has been confusing embedding improvements with real phases. Let me clarify:

| Phase | Real Purpose | From Discussion |
|-------|--------------|------------------|
| **Phase 1** | **EXTRACTION** - Get knowledge from sources into vault | Should include complete embedding/dedup |
| **Phase 2** | **GENERATION** - Create outputs (flashcards, stories, etc.) | Not about embeddings |
| **Phase 3** | **FEEDBACK** - Learn from user corrections | Not about embeddings |

The current TODO.md "Phase 2" is really "Embedding Phase 2" which should be **part of Phase 1 completion**.

---

## Embedding Improvements (Part of Phase 1 Completion)

From [TODO.md](file:///home/mac/projects/knowhow1/TODO.md):

### Embedding Quality
- [ ] Test embedding similarity accuracy with edge cases
- [ ] Tune threshold (0.7 may be too low/high)
- [ ] Add LLM verification for ambiguous matches (0.7-0.9)

Q: What's "LLM verification for ambiguous matches"?

**A:** When similarity is between 0.7-0.9, we're not 100% sure they're duplicates. Instead of blindly skipping, we'd ask GPT-5-nano: "Are these the same concept? A: 'Feedback Loop' B: 'Iteration Cycle'". This adds one cheap LLM call but increases accuracy.

### Embedding Improvements
- [ ] Index stubs with their `embedding_match_keys`
- [ ] Batch embedding calls (reduce API usage)
- [ ] Cache embeddings across runs
- [ ] Add embedding similarity to `LINK_INTENTS` output

Q: Why batch embedding calls?

**A:** Currently, each note is embedded individually. If we're processing 50 notes, that's 50 API calls. Azure's embedding API supports batch input (`input: ["text1", "text2", ...]`), so we could do 50 notes in 1 call. This saves time and may have cost benefits.

Q: What's "cache embeddings across runs"?

**A:** Currently, if you run the pipeline twice on the same vault, we re-embed all notes. If a note hasn't changed, we could skip re-embedding. The `embedding_keys` are already stored, so we'd just check: "did embedding_keys change? No → use cached embedding".

---

## Known Issues 🐛

1. **Some stubs created for existing concepts**
   - Example: "The Calibration Loop" vs "Calibration Loop" - slight naming difference
   - Current threshold (0.7) should catch this, but sometimes doesn't
   - **Solution**: Improve embedding keywords or add fuzzy title matching

Q: Why doesn't the embedding catch "The Calibration Loop" vs "Calibration Loop"?

**A:** Good question! Possible reasons:
1. The embedding_keys might be different enough to reduce similarity
2. One might not have embedding_keys at all (stubs initially don't)
3. The 0.7 threshold might be too high for this case

We should add a test case for this and tune accordingly.

R: I think we should have a content index or content idea index and use that. The modeller is extracting more, can store more and we could use that. Analyse the potential here.

**A:** Great idea! Currently we only embed `embedding_keys` (3-5 words). But the modeler also extracts:
- `reason` - why this was extracted
- `quote` - the source text
- Full note body with definitions, examples

**Content Index Proposal:**
```
_index/vectors.db
├── notes (current: id, title, embedding_keys)
│   └── ADD: definition_embedding, full_content_embedding
├── note_vectors (current: title-based)
│   └── ADD: definition_vectors, content_vectors
└── NEW: content_index
    ├── note_id
    ├── summary (LLM-generated 1-sentence)
    └── key_ideas[] (bullet points from ## sections)
```

**Use cases:**
1. **Better dedup**: Compare definitions, not just titles
2. **Semantic search**: "Find notes about learning plateaus" → searches content
3. **Related notes**: "Notes with similar key ideas" → cross-links

This is a **Phase 1b** enhancement - after basic embedding works correctly.


---

## Legacy: JSON Embedding Index

The file [note-embedding-index.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/note-embedding-index.ts) is the **old approach** before SQLite-vec:

```
_index/embeddings.json
└── { "version": "1.0", "notes": { "note-id": { embedding: [...] } } }
```

**Status:** Deprecated but still present. The new `vector-store.ts` using SQLite-vec is the canonical implementation. We keep the old file for backwards compatibility but it's not actively used.

---

## Phase 1 Completion Plan (Embeddings) 🎯

> This is what needs to be done to FINISH embedding as part of Phase 1.

### HIGH Priority (Must Have)

1. **Improve candidate keywords for dedup search**
   - Currently: title words only
   - Fix: Use `candidate.reason` + `candidate.quote` snippet
   - File: `step-executors.ts` lines 627-635

2. **LLM verification for ambiguous matches (0.7-0.9)**
   - Add GPT-5-nano call: "Are A and B the same concept?"
   - File: `step-executors.ts` after line 637

3. **Create link when duplicate found**
   - Currently: just skips
   - Fix: Track skipped candidates, create wikilinks in source notes
   - File: `step-executors.ts` after dedup check

4. **Index stubs with embedding keys**
   - Currently: stubs not searchable
   - Fix: When creating stub, add to vector store
   - File: `linker.ts` after writing stub

### MEDIUM Priority (Should Have)

5. **Better embedding text generation**
   - Combine: title + embedding_keys + definition snippet
   - More semantic richness than just keywords

6. **Merge content on high-confidence match (>0.9)**
   - Currently: skip only
   - Fix: Append new context to existing note

### LOW Priority (Nice to Have)

7. Batch embedding calls
8. Cache embeddings across runs
9. Adaptive threshold based on vault size

---

## Real Phases Overview 📊

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | **EXTRACTION** | 🟡 80% | Get knowledge from sources → vault |
| 1a | └── Pipeline | ✅ Done | vNext runbook, steps working |
| 1b | └── Embeddings | 🟡 PoC | Basic dedup works, needs completion |
| 1c | └── Validation | ✅ Done | phase1-validator, unit tests |
| 2 | **GENERATION** | ❌ Not Started | Flashcards, stories, quizzes |
| 3 | **FEEDBACK** | ❌ Not Started | User corrections, self-learning |

### What's Open in Phase 1:

| Item | Status | Discussed In |
|------|--------|---------------|
| Complete embedding dedup flow | 🟡 See plan above | This doc |
| Lens-based extraction | ❌ Not started | [vnext-pipeline-flow](file:///home/mac/projects/knowhow1/discussions/2026-01-08_vnext-pipeline-flow.md) |
| Author structure preservation | ❌ Not started | vnext-pipeline-flow |
| Multi-source/folder processing | ❌ Not started | vnext-pipeline-flow |
| Metaphor-aware extraction (RUNG) | ❌ Not started | vnext-pipeline-flow |

### SQLite Expansion (Future Discussion)

| Topic | Priority | Notes |
|-------|----------|-------|
| Use SQLite for backlinks index | Could do now | Already have the DB |
| FTS5 for full-text search | Phase 2 | After generation needs search |
| Notes-in-SQLite vs files | Phase 3+ | Big architectural change |
| Vault viewer app | If SQLite content | Needed to inspect vault |

---

## Questions?

Add your questions here with **Q:** prefix and I'll answer below!



R: I comment here on the overall work to be done:

| Phase | Real Purpose | From Discussion |
|-------|--------------|------------------|
| **Phase 1** | **EXTRACTION** - Get knowledge from sources into vault | Should include complete embedding/dedup |
| **Phase 2** | **GENERATION** - Create outputs (flashcards, stories, etc.) | Not about embeddings |
| **Phase 3** | **FEEDBACK** - Learn from user corrections | Not about embeddings |


Before we go to Phase 2 - generating content, we must complete Phase 1 - extraction in its fullest. Currently we focus on embeddings. This is top prio to be implemented the right way. Still not sure if we got all points here. 

Can you do high level overview of the pipeline without code samples more textually but short enough to get the idea?

e.g.:

CLI call with ONE FILE:

...



Than lets say once we have embeddings better implemented (or mayb earlier):

we need to fix these points:

1. we are still only storing information snippets in the vault. With a better linking and better deduplicates etc., but yust snippets. We need to implement that the source (even if its just one file) is ONE major flow map for the snippets. The Zettelkasten approach has that in mind. We have that in the PRDV2 spec files, but somehow it got lost... So here my ideas again:

Source - could be one file, a folder of a book, a webinar with many files 

We extract snippets and store the flow in form of a map (more or less linking right?). Ideally if I would say: list book xyz the system should be able to more or less reconstruct the book internal knowledge and teaching way. 

We should start to think what do we need for phase 2 - the generation part? What are we extracting and what kind of structure to we extract as well? 

OPen for discussions here...

2. tired - later later - I let you work on embeddings now :) 