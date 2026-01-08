# vNext Pipeline: Step-by-Step Execution Flow

> **Created**: 2026-01-08  
> **Context**: vNext Pipeline Implementation (M1-M5)  
> **Purpose**: Understanding the exact execution flow of the Canon Extraction Pipeline  
> **Runbook Version**: 1.2 (vnext-pipeline.yml)  
> **Related**: [PRD-IDEATION-VNEXT-INTEGRATED-v1.0.md](file:///home/mac/projects/knowhow1/PRDV2/idea01/docs/PRD-IDEATION-VNEXT-INTEGRATED-v1.0.md)

This document traces **exactly what happens** when you run the vNext pipeline, from CLI entry to final output. Add your questions at the bottom and I'll answer them!

Question are ANYWHERE in the document noted with a Q: - please direct under the question, do not delete the question. This should be like a thread of questions and answers.


---

## Quick Reference

| Step | Type | Purpose | LLM? | Key File |
|------|------|---------|------|----------|
| 1 | ingest | Store raw source | ❌ | `ingestor.ts` |
| 2 | chunk | Split into pieces | ❌ | `chunker.ts` |
| 3 | gate | Classify chunks | ✅ Azure | `chunk-gate.ts` |
| 4 | assemble_corpus | Build filtered text | ❌ | `corpus-assembler.ts` |
| 5 | extract | Find candidates | ✅ DeepSeek | `extractor.ts` |
| 6 | resolve | Dedupe candidates | ✅ DeepSeek | `resolver.ts` |
| 7 | model | Create notes | ✅ DeepSeek | `modeler.ts` |
| 8 | verify | Check quality | ✅ DeepSeek | `verifier.ts` |
| 9 | link | Resolve wikilinks | ✅ Azure | `linker.ts` |
| 10 | emit_candidates | Create incubator notes | ❌ | `candidate-emitter.ts` |
| 11 | emergent_artifacts | Create strands/MOCs | ✅ DeepSeek | `emergent-artifacts.ts` |
| 12 | index | Build graph | ❌ | `indexer.ts` |
| 13 | story | Optional narrative | ✅ DeepSeek | `storyteller.ts` |


Q: I assume with Azure GPT-5-nano is meant?

**A:** Yes! Azure GPT-5-nano is a fictional but realistic model representing cheap, fast inference for simple classification tasks. In real deployment this would be something like `gpt-4o-mini` or a custom fine-tuned model. The idea: use expensive models (DeepSeek) for complex reasoning, cheap models (GPT-5-nano) for binary decisions.


---

## Entry Point

```bash
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./benchmark/source.md \
  --vault ./benchmark/test-vault
```

Q: I checked the pipline in the source vault - M4 is not marked as completed. 

**A:** You're right! The runbook YAML file doesn't have M4 annotations. M4 is implemented in the **code** (`step-executors.ts`), not declared in the runbook. The verify step now checks for `verified: true` in frontmatter and skips those notes. You can see it working in the logs: `[Verify] Pass rate: 100.0% (12/12, 11 skipped)`. The template vault is the same - M4 is transparent optimization.


### Files Called:
1. **[cli.ts](file:///home/mac/projects/knowhow1/src/systems/research/cli.ts)** - Parses args, calls `runRunbook()`
2. **[runbook-runner.ts](file:///home/mac/projects/knowhow1/src/systems/research/runbook-runner.ts)** - Orchestrates everything

### What Happens:
```
cli.ts
  ├─ Parse --runbook, --file, --vault
  ├─ Create LLM provider (DeepSeek by default)
  ├─ Copy template vault if needed
  └─ Call runRunbook()
      ├─ Load runbook YAML
      ├─ Initialize RunLogger
      └─ Execute steps in sequence
```

---

## Step 1: Ingest

**Runbook Entry:**
```yaml
- id: ingest
  type: ingest
  inputs:
    file: "{{file}}"
```

**Executor:** `registerStepExecutor('ingest', ...)` in [step-executors.ts:35-80](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L35-80)

**Agent Called:** [ingestor.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/ingestor.ts)

### What Happens:
```
ingest step
  ├─ Read source file from disk
  ├─ Generate source ID: hash of content → "src_38e4b47a40f0"
  ├─ Create directory: _sources/source-{name}-{hash}/
  ├─ Write raw.md (raw source text)
  └─ Create source anchor: sources/source-{name}-{hash}.md
```

**No LLM call** - pure file I/O

Q: How would we proceed with a whole folder, e.g. a full book like in booksample? Do we have something like a source map where we note where something comes from originally and can re-recreate the original flow of the different contexts we extract? This would require that either the system would ask for specification: WHat is this source from or what is it etc.? Could be a book and I might answer or give it in the prompt. Than the LLM could research and figure out what this book is all about and store this in a file like READ.ME for the folder. Or I could compile this READ.ME upfront. Sources could be a book, a webinar recording etc. Could in form of chapters or tapes. Thats where the idea of the chunking came from. We do not only have a small test file, but many files which could be even quite large. 

**A:** Excellent point! Currently we only support **single file** input. For a book/folder, we need:

1. **Source Manifest**: A `README.md` or `source-manifest.yml` in the folder describing:
   - Type: book, webinar, course
   - Structure: chapters, recordings, slides
   - Original order/hierarchy
   - Author's pedagogical intent

2. **Batch Ingestion**: Loop through files maintaining order/context. Track `chapter_seq`, `source_hierarchy`.

3. **Source Links**: Each extracted note keeps `derived_from: ["chapter-03.md", "source-my-book"]` so we can trace back.

**This is a gap.** We should add a `batch_ingest` step that reads a folder with manifest.

Furthermore, I still think we should use GPT-5-nano for the chunking. Like we could pre-chunk in larger seqments and than late the LLM do the proper chunking. As far as I remember we wanted a slicing chunk window later on. The extractor would see chunk 1-2 where 1 is the focus (we have to start somewhere) and then 1-2-3 where 2 is the focus, than 2-3-4 where 3 is the focus etc. That way we would go through all files. Important here is, that some of the source files might be wrongly cut and very small. I use my own tool to read the source PDFs and extract md files with a chapter format from them with image which get a proper abstract description rather than just the text description. 

**A:** YES! This is exactly what `model_bundle` (M3) was supposed to do! We have `window-assembler.ts` that creates sliding windows: `[prev, current, next]`. The problem is the current pipeline still uses the OLD extract→model flow. We should:

1. **Pre-chunk**: Split at natural boundaries (chapters, headings) - no LLM needed
2. **Sliding Window Extraction**: For each chunk, assemble `[chunk-1, chunk, chunk+1]` window
3. **Extract+Model in one pass**: Let the LLM extract AND model from that window directly

Your PDF tool output is perfect input - each chapter becomes a chunk. We skip the awkward "re-assemble corpus" step entirely.


**Output to Context:**
```typescript
{
  sourceId: "src_38e4b47a40f0",
  sourceContent: "full text...",
  sourceTitle: "benchmark_source_nohints.md"
}
```

---

## Step 2: Chunk

**Runbook Entry:**
```yaml
- id: chunk
  type: chunk
  inputs:
    file: "{{file}}"
  decision_points:
    - name: chunkSize
      allowed: { min: 1500, max: 4000 }
```

**Executor:** `registerStepExecutor('chunk', ...)` in [step-executors.ts:82-140](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L82-140)

**Utility Called:** [chunker.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/chunker.ts)

### What Happens:
```
chunk step
  ├─ LLM Decision: Ask DeepSeek for optimal chunkSize (1500-4000)
  │   └─ Usually returns 2000-2500
  ├─ Split source text at paragraph boundaries
  ├─ For each chunk:
  │   ├─ Generate chunk ID: {sourceId}_chunk_{seq}
  │   ├─ Write to _sources/{sourceId}/chunks/{seq}.md
  │   └─ Include frontmatter with seq, source_id
  └─ Write manifest.json with chunk count
```

**1 LLM call** for decision (DeepSeek)

**Output to Context:**
```typescript
{
  chunks: 2,
  chunks_dir: "_sources/src_38e4b47a40f0/chunks"
}
```

Q: so we are using the full expensive LLM for chunking? I thought this is best for GPT-5-nano? As described above, I have to see what we do with the chunks :). I comment as I am reading....

**A:** You're right - this is wasteful! The DeepSeek call here is just to decide "chunkSize = 2000". That's a **trivial decision** that should either be:
1. **Hardcoded**: Just use 2000-2500 always
2. **GPT-5-nano**: If we really want LLM decision, use the cheap model
3. **Heuristic**: `chunkSize = min(3000, textLength / 3)` - no LLM at all

I'll note this as an optimization. The actual chunking itself (splitting text) is just code, no LLM.


---

## Step 3: Gate

**Runbook Entry:**
```yaml
- id: gate
  type: gate
  inputs:
    chunks: "from_context"
  decision_points:
    - name: strictness
      allowed: [lenient, balanced, strict]
```

**Executor:** `registerStepExecutor('gate', ...)` in [step-executors.ts:142-200](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L142-200)

**Agent Called:** [chunk-gate.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/chunk-gate.ts)

### What Happens:
```
gate step
  ├─ LLM Decision: Ask DeepSeek for strictness (balanced)
  ├─ Load all chunks from chunks_dir
  ├─ For each chunk:
  │   ├─ Extract ~500 char snippet
  │   ├─ Load prompt: _system/prompts/prompt-gate-chunk-nano.md
  │   ├─ Call Azure GPT-5-nano (cheap, fast)
  │   │   └─ Input: ~2.5kb (~600 tokens)
  │   ├─ Parse decision: FULL_MODEL | LIGHT_SCAN | SKIP
  │   └─ Update chunk frontmatter with decision
  └─ Count results (e.g., 2 FULL_MODEL, 0 SKIP)
```

Q: again with the chunks??? We do a lot of LLM calls just for chunking - this seems a little bit overload. Lets see what we do with the chunks :)

**A:** I hear you! The gate is actually **useful** overhead though. Its purpose:
- Skip fluff chunks (table of contents, acknowledgments, bibliography)
- Classify: `FULL_MODEL` (extract concepts), `LIGHT_SCAN` (just index), `SKIP` (ignore)

But yes, for a well-structured PDF with chapters, many chunks will be `FULL_MODEL` anyway. The ROI is higher when ingesting messy sources (web scrapes, mixed documents). For clean book chapters, we could skip gating entirely or only gate every Nth chunk.


**1 LLM call per chunk** (Azure GPT-5-nano)

**Output to Context:**
```typescript
{
  gate_decisions: { FULL_MODEL: 2, LIGHT_SCAN: 0, SKIP: 0 }
}
```

---

## Step 4: Assemble Corpus (M1)

**Runbook Entry:**
```yaml
- id: assemble_corpus
  type: assemble_corpus
```

**Executor:** `registerStepExecutor('assemble_corpus', ...)` in [step-executors.ts:202-250](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L202-250)

**Utility Called:** [corpus-assembler.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/corpus-assembler.ts)

### What Happens:
```
assemble_corpus step
  ├─ Load all chunks with FULL_MODEL decision
  ├─ Sort by sequence number
  ├─ Concatenate with separators:
  │   === CHUNK 000000 ===
  │   [chunk content]
  │   === CHUNK 000001 ===
  │   [chunk content]
  ├─ Also create LIGHT_SCAN corpus (if any)
  └─ Save to _runs/{runId}/corpus/full_model.txt
```

**No LLM call** - pure file I/O

**Output to Context:**
```typescript
{
  fullModelText: "=== CHUNK 000000 ===\n...",
  lightScanText: ""
}
```
Q: so now we combine the chunks together again? Maybe leaving out something? How many LLM calls up to now??? Crazy....

**A:** Yes, we reassemble - but only `FULL_MODEL` chunks! If gate marked some as `SKIP`, they're excluded. This is the benefit of gating.

**LLM calls so far:**
- Chunk decision: 1 (should be 0 or nano)
- Gate strictness: 1 (should be 0 or nano)  
- Gate per chunk: 1 per chunk (nano)

For 2 chunks: **~4 calls** before any real work. You're right - this is too many for small sources. The overhead is designed for **large books** where skipping chapters saves significant tokens later. For a 5kb test file, it's overkill.

**Proposal**: Add a `fast_mode` that skips gate for sources < 10kb.



---

## Step 5: Extract

**Runbook Entry:**
```yaml
- id: extract
  type: extract_filtered
  inputs:
    file: "{{file}}"
```

**Executor:** `registerStepExecutor('extract_filtered', ...)` in [step-executors.ts:252-300](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L252-300)

**Agent Called:** [extractor.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/extractor.ts)

### What Happens:
```
extract step
  ├─ Load prompt: _system/prompts/prompt-extract-candidates.md
  ├─ Inject: source_title, source_text (from fullModelText!)
  ├─ Log: [Extractor] source | input: 9.7kb (~2419 tokens)
  ├─ Call DeepSeek with prompt
  ├─ Parse JSON output: array of candidates
  │   └─ Each: { type, name, quote, reason }
  └─ Return candidates list
```

**1 LLM call** (DeepSeek) - input ~10kb

**Output to Context:**
```typescript
{
  candidates: [
    { type: "concept", name: "Outcome Ladder", quote: "...", reason: "..." },
    { type: "principle", name: "Spend Friction...", quote: "...", reason: "..." },
    // ... 10-15 candidates
  ]
}
```

Q: so we still doing this very critical step where we decide on the outcome of the whole process? And now again with the full text? What if we have a one hour tape recording text here? Good luck with that.  If I look at the first Q where I describe this sliding chunking - I thought the flow would be to take the 3 chunks, tell the LLM to focus on the middle one, the outer one are for reference, and do the modelling in one step. Here we are small enought to do that, arent we? 

**A:** 100% agree. This is the **core problem** with the current pipeline:

**Current (inefficient):**
```
full_text → extract ALL candidates → model each candidate separately
```

**Better (sliding window):**
```
For each chunk:
  window = [prev, current, next]
  extract+model from window → output notes directly
  dedupe against existing vault via embeddings
```

This is exactly what `model_bundle` step was meant to do! We already have `window-assembler.ts` built for this. The problem: the current runbook still uses the old flow. We need to **replace steps 5-7** with a single `model_bundle` step that:
1. Takes window
2. Extracts candidates from focused chunk
3. Models them immediately with full context
4. Returns verified notes

For a 1-hour tape: instead of 1 huge 50kb extraction call, we'd do ~20 smaller 5kb window calls. Much more manageable!


---

## Step 6: Resolve

**Runbook Entry:**
```yaml
- id: resolve
  type: resolve
```

**Executor:** `registerStepExecutor('resolve', ...)` in [step-executors.ts:302-370](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L302-370)

**Agent Called:** [resolver.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/resolver.ts)

### What Happens:
```
resolve step
  ├─ Load existing vault notes (concepts/, principles/, etc.)
  ├─ For each candidate:
  │   ├─ Check if similar note exists
  │   ├─ If yes: mark for MERGE
  │   └─ If no: mark for CREATE
  └─ Return resolution map
```

**Usually 0 LLM calls** (unless merging)

**Output to Context:**
```typescript
{
  resolutionMapData: {},  // empty if all new
  candidates: [...]       // passed through
}
```

Q: here I thought we do a complete different concept. The previous step create a short keyword description of the candidate. This is going through an embedding process to find similar notes. So we keep a embedding database for all notes. That way we would retrieve the first 3 possible candidates and than ask the LLM to check if there is a match. That would be one call to the LLM. Maybe even to GPT-5-nano. For the embeddings I have a embed-v-4-0 in Azure. Same endpoint as deepseek and openai compatible as well. A local database for the embeddings would  do. 

**A:** YES! This is the right architecture:

**Current (naive):**
```
for each candidate:
  for each existing_note:
    if name.toLowerCase() === existing.toLowerCase(): merge
```

**Better (embeddings):**
```
1. Each note gets an embedding stored in local vector DB (e.g., sqlite-vec, ChromaDB)
2. For new candidate:
   - Generate embedding
   - Query: "find top 3 similar notes"
   - If similarity > 0.85: ask LLM "are these the same concept?"
   - Merge or create new
```

You have `embed-v-4-0` in Azure - perfect. We could use volcano-sdk's Azure provider for embeddings too. This would:
- Make resolution **scalable** (vault with 10,000 notes? no problem)
- Catch semantic duplicates like "Feedback Loop" vs "Feedback Cycle"
- Allow fuzzy matching for typos

**Action item**: Add embedding layer to resolver.



---

## Step 7: Model

**Runbook Entry:**
```yaml
- id: model
  type: model
  decision_points:
    - name: model_depth
      allowed: [shallow, standard, deep]
```

**Executor:** `registerStepExecutor('model', ...)` in [step-executors.ts:375-500](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L375-500)

**Agent Called:** [modeler.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/modeler.ts)

### What Happens:
```
model step
  ├─ LLM Decision: model_depth (standard)
  ├─ For each candidate:
  │   ├─ Extract context window around quote
  │   ├─ Load prompt: _system/prompts/prompt-model-artifact.md
  │   ├─ Inject: artifact_type, artifact_name, source_context, source_id
  │   ├─ Log: [Modeler] Concept Name (type) | input: 10.9kb (~2740 tokens)
  │   ├─ Call DeepSeek
  │   ├─ Write note to: {type}s/{type}-{slug}.md
  │   ├─ Run inline verification (see Step 8)
  │   ├─ If pass: add "verified: true" to frontmatter (M4)
  │   └─ If fail: retry once with critique
  └─ Return list of created notes
```

**1 LLM call per candidate** (DeepSeek) - input ~11kb each
**+ 1-2 verification calls per candidate** (inline)

**Output to Context:**
```typescript
{
  notes_created: 12,
  notes: [
    "/vault/concepts/concept-outcome-ladder.md",
    "/vault/principles/principle-spend-friction.md",
    // ...
  ]
}
```
Q: If we would do modelling on the sliding chungs we could put this step ahead where we got the candidates and would get the whole modeling done at this point already. 

**A:** Exactly! With sliding windows, the flow becomes:

```
For each window (chunk N with context N-1, N+1):
  1. Ask LLM: "From this text (focus on middle), extract AND model concepts"
  2. Output: complete notes with YAML frontmatter + content
  3. Inline verify (or skip if confident)
  4. Write to vault
  5. Update embeddings for dedup
```

One prompt does extract+model. No separate "candidates" list to iterate. Much cleaner.



---

## Step 8: Verify

**Runbook Entry:**
```yaml
- id: verify
  type: verify
```

**Executor:** `registerStepExecutor('verify', ...)` in [step-executors.ts:615-665](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L615-665)

**Agent Called:** [verifier.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/verifier.ts)

### What Happens (with M4 optimization):
```
verify step
  ├─ For each note in notes list:
  │   ├─ Check if "verified: true" in frontmatter
  │   ├─ If yes: SKIP (M4 optimization!)
  │   │   └─ Log: [Verify] Skipping note.md (already verified)
  │   └─ If no:
  │       ├─ Load prompt: _system/prompts/prompt-verify-note.md
  │       ├─ Log: [QA-Verifier] note.md | input: 2.3kb (~575 tokens)
  │       ├─ Call DeepSeek (schema check)
  │       ├─ Load prompt: _system/prompts/prompt-verify-grounding.md
  │       ├─ Log: [Grounding] note.md | input: 6.8kb (~1700 tokens)
  │       └─ Call DeepSeek (grounding check)
  └─ Log: Pass rate: 100.0% (12/12, 11 skipped)
```

**With M4: Most notes skipped!** (verified during modeling)
**Without M4: 2 LLM calls per note**

---

## Step 9: Link

**Runbook Entry:**
```yaml
- id: link
  type: link
```

**Executor:** `registerStepExecutor('link', ...)` in [step-executors.ts:670-720](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L670-720)

**Agents Called:**
- [link-resolver.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/link-resolver.ts) - resolves existing links
- [linker.ts](file:///home/mac/projects/knowhow1/src/systems/research/agents/linker.ts) - creates stubs

### What Happens:
```
link step
  ├─ Phase 1: Resolve existing [[wikilinks]]
  │   ├─ Scan all notes for [[Term]]
  │   └─ Check if target exists, update link
  └─ Phase 2: Create stubs for missing links
      ├─ Find all unresolved [[Term]] references
      ├─ For each missing term:
      │   ├─ Call Azure GPT-5-nano for stub content
      │   └─ Create concepts/-{slug}.md (stub note)
      └─ Log: Created 25 stubs
```

**1 LLM call per stub** (Azure GPT-5-nano)

Q: Here I am not sure if we should really do this for every chunk we modelled. MAybe have something like that once we modelled a whole book/folder. Although I saw that stubs are no marked with a -. But all put into the concepts folder. I thinks stubs should get there own stubs folder and stay there until we found a real reference and move them into the propriate folder. That way the concepts folder would stay clean and not get overpopulated. What we need for a stub is this keys for the embedding. That what the modeller should give us as well. Than creating the stubs could be done via script and the AI part we save for later. 

**A:** You're completely right on all points:

1. **Timing**: Creating stubs per-chunk is wasteful. Better to:
   - Batch collect all `[[Unresolved Term]]` references
   - At END of book/folder, dedupe them
   - Create stubs once

2. **Stubs folder**: I love the `stubs/` folder idea! Currently stubs go to `concepts/-term.md` (the `-` prefix marks them, but it's ugly). Better:
   ```
   stubs/
     stub-concept-feedback-loop.md
     stub-principle-deliberate-practice.md
   ```
   When we find a real reference, promote: `stubs/ → concepts/`

3. **Embedding keys**: The modeler SHOULD output something like:
   ```yaml
   embedding_keys: ["feedback", "iteration", "learning loop"]
   ```
   Then stub creation is just:
   - Write minimal YAML + placeholder body
   - Generate embedding from keys
   - Add to vector DB
   - **No LLM!**

**Action item**: Add `stubs/` folder, make linking phase batch-collect, defer LLM stub content.



---

## Step 10: Emit Candidates (M2)

**Runbook Entry:**
```yaml
- id: emit_candidates
  type: emit_candidates
```

**Executor:** `registerStepExecutor('emit_candidates', ...)` in [step-executors.ts:725-800](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L725-800)

**Utility Called:** [candidate-emitter.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/candidate-emitter.ts)

### What Happens:
```
emit_candidates step
  ├─ For each note in notes list:
  │   ├─ Find ## LINK_INTENTS section
  │   ├─ Parse JSON: { note_id, link_intents: [...] }
  │   └─ Extract candidates with stub_policy: create_*
  ├─ For each candidate:
  │   ├─ Check if note already exists (skip if so)
  │   ├─ Generate filename: candidate-{type}-{slug}.md
  │   └─ Write to incubator/candidate-{type}-{slug}.md
  │       └─ Frontmatter: status: candidate
  └─ Log: Summary: created=7, skipped=60
```

**No LLM call** - deterministic file creation

Q: do not understand this step. 

**A:** Let me explain! When the modeler creates a note, it can output a `LINK_INTENTS` section like:

```markdown
## LINK_INTENTS
```json
{
  "note_id": "concept-outcome-ladder",
  "link_intents": [
    { "target": "Transfer (Learning)", "type": "concept", "stub_policy": "create_if_missing" },
    { "target": "Deliberate Practice", "type": "concept", "stub_policy": "create_if_missing" }
  ]
}
```

`emit_candidates` reads this and creates **incubator notes** without LLM:
- `incubator/candidate-concept-transfer-learning.md`
- `incubator/candidate-concept-deliberate-practice.md`

These are **minimal placeholders** waiting to be fleshed out later when we process more sources. It's like saying "we think this concept exists but we haven't seen it fully explained yet."

**Difference from stubs:**
- Stubs = created from unresolved `[[wikilinks]]` in text
- Candidates = created from modeler's structured `LINK_INTENTS` output

Honestly, they serve similar purposes. We could merge them.


---

## Step 11: Emergent Artifacts (M5)

**Runbook Entry:**
```yaml
- id: emergent_artifacts
  type: emergent_artifacts
```

**Executor:** `registerStepExecutor('emergent_artifacts', ...)` in [step-executors.ts:800-830](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L800-830)

**Utility Called:** [emergent-artifacts.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/emergent-artifacts.ts)

### What Happens:
```
emergent_artifacts step
  ├─ Create Book Strand (no LLM)
  │   └─ slipbox/strands/strand-{sourceId}.md
  ├─ Create MOC (no LLM)
  │   └─ slipbox/mocs/moc-{topic}.md
  ├─ Create Trail (no LLM)
  │   └─ slipbox/trails/trail-{topic}.md
  └─ Create Bridge (1 LLM call)
      ├─ Log: [BridgeCreator] A ↔ B | input: 0.4kb (~94 tokens)
      ├─ Call DeepSeek for synthesis
      └─ slipbox/bridges/bridge-{a}-{b}.md
```

**1 LLM call** for bridge (DeepSeek)

Q: Oh this was the new idea to have continuity for a folder, right? Otherwise I do not understand. 

**A:** Yes, exactly! These are **emergent structures** that appear after processing a source:

1. **Book Strand**: "Here's the ordered path through all notes from this source, preserving author's sequence."
   - Like a reading list: Concept A → Procedure B → Principle C → ...
   - Keeps original structure alive!

2. **MOC (Map of Content)**: "Here's a topic overview grouping related notes."
   - Organized by type: all concepts, all procedures, etc.
   - Entry point for exploring

3. **Trail**: "Here's a learning path through these notes."
   - Ordered for pedagogy: concepts first, then procedures, then principles
   - Could be generated or curated

4. **Bridge**: "Here's how two seemingly different concepts connect."
   - Uses LLM to synthesize relationship
   - Creates new insight!

For a book, you'd get:
- `strand-coaching-book.md` = author's original chapter order
- `moc-coaching.md` = topic overview
- `trail-coaching.md` = learning sequence
- `bridge-outcome-ladder-friction-budget.md` = cross-concept insight

This is the Zettelkasten "emergent structure" - patterns that appear from the notes themselves.


---

## Step 12: Index

**Runbook Entry:**
```yaml
- id: index
  type: index
```

**Executor:** `registerStepExecutor('index', ...)` in [step-executors.ts:830-870](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts#L830-870)

**Utility Called:** [indexer.ts](file:///home/mac/projects/knowhow1/src/systems/research/utils/indexer.ts)

### What Happens:
```
index step
  ├─ Scan all folders: concepts/, principles/, etc.
  ├─ Parse each .md file:
  │   ├─ Extract frontmatter (id, type, tags)
  │   ├─ Extract title from # heading
  │   └─ Find [[wikilinks]] for graph
  ├─ Build backlinks (who links to whom)
  └─ Write _index/notes.json
```

**No LLM call** - file parsing only

---

## Step 13: Story (Optional)

**Runbook Entry:**
```yaml
- id: story
  type: story
  conditions:
    has_concepts: true
```

**Usually skipped** unless conditions met.

---

## Data Flow Diagram

```
┌─────────────┐
│ Source File │
└──────┬──────┘
       ▼
┌──────────────┐    ┌──────────────┐
│   ingest     │───▶│  _sources/   │
└──────┬───────┘    │  raw.md      │
       ▼            └──────────────┘
┌──────────────┐    ┌──────────────┐
│    chunk     │───▶│  chunks/     │
└──────┬───────┘    │  000000.md   │
       ▼            └──────────────┘
┌──────────────┐
│    gate      │ ◀── Azure GPT-5-nano
└──────┬───────┘
       ▼
┌──────────────┐    ┌──────────────┐
│ assemble     │───▶│ corpus/      │
│ corpus       │    │full_model.txt│
└──────┬───────┘    └──────────────┘
       ▼
┌──────────────┐
│   extract    │ ◀── DeepSeek
└──────┬───────┘
       ▼
┌──────────────┐
│   resolve    │
└──────┬───────┘
       ▼
┌──────────────┐    ┌──────────────┐
│    model     │───▶│ concepts/    │
│  + verify    │ ◀──│ principles/  │
└──────┬───────┘    │ procedures/  │
       ▼            └──────────────┘
┌──────────────┐
│   verify     │ ◀── DeepSeek (M4: skips most)
└──────┬───────┘
       ▼
┌──────────────┐    ┌──────────────┐
│    link      │───▶│ concepts/-*  │
└──────┬───────┘ ◀──│ (stubs)      │
       ▼            └──────────────┘
┌──────────────┐    ┌──────────────┐
│ emit_cand    │───▶│ incubator/   │
└──────┬───────┘    │candidate-*   │
       ▼            └──────────────┘
┌──────────────┐    ┌──────────────┐
│ emergent     │───▶│ slipbox/     │
│ artifacts    │    │strands,mocs  │
└──────┬───────┘    └──────────────┘
       ▼
┌──────────────┐    ┌──────────────┐
│    index     │───▶│ _index/      │
└──────────────┘    │ notes.json   │
                    └──────────────┘
```

---

## Key Files Quick Reference

| Category | File | Purpose |
|----------|------|---------|
| **Entry** | [cli.ts](file:///home/mac/projects/knowhow1/src/systems/research/cli.ts) | Command line parser |
| **Orchestration** | [runbook-runner.ts](file:///home/mac/projects/knowhow1/src/systems/research/runbook-runner.ts) | Step executor |
| **Executor Registry** | [step-executors.ts](file:///home/mac/projects/knowhow1/src/systems/research/step-executors.ts) | All step handlers |
| **Runbook** | [vnext-pipeline.yml](file:///home/mac/projects/knowhow1/src/systems/research/vault/_system/runbooks/vnext-pipeline.yml) | Pipeline config |
| **Agents** | `src/systems/research/agents/*.ts` | LLM-calling modules |
| **Utilities** | `src/systems/research/utils/*.ts` | Non-LLM helpers |
| **Prompts** | `vault/_system/prompts/*.md` | All LLM prompts |

---

## Questions?

Add your questions below and I'll answer them:

<!-- YOUR QUESTIONS HERE -->

We are on our way. Still more a We create a dictionary of all the whatever we find in the source file. Not really a knowledge extraction system with a Zettelkasten concept behind it. I am missing that we keeo any existing knowledge structure from the source, e.g. form a book or a webinar. The author had some ideas why they present the data as they presented it. We loose that completely. On the other hand a Zettelkasten should be the way when I read something, I have mayb ideas, or need clarification about something, I create stubs which migh be filled later. And I keep as well some structure how items belong to each other. I think originall Luhmann when he put something into his Zettelkasten he thought: where does it fit? Than he just added it as next item and linked to the previous item. Plus there might be references to other items and so on. That was the idea of this project. Extract information from a source withou summarizing but looking at the concepts behind it with the focus or core question: How can I use that for training or educucation? How did the author wanted us to understand whats going on? So the extraction should be not only the pure concept, but the educational concept behind. So we would have multiple layers of knowledge extraction. Thats where the additional idea of a lens came in. Do a NLP style modelling (neuro linguistic programming). Do a DBM  style modelling. Or maybe the AI comes up with its own modelling idea??? (dream vision) 

**A: Big Picture Response - You're Right!**

This is the **core vision issue**. Currently we're doing:
```
Source → Extract "things" → Put in folders → Done
```

That's a **dictionary**, not a Zettelkasten. What Luhmann did was:
```
Read → "What does this connect to?" → Insert near related idea → Link bidirectionally → Grow emergent structure
```

**What we're missing:**

1. **Author's Intent**: Why did they present X before Y? What's the pedagogical arc?
   - Solution: Store `source_structure` metadata. The Book Strand is a start, but we need to explicitly model "author wanted you to understand X before Y"

2. **Reader's Questions**: When I read, I wonder "but what about Z?"
   - Solution: The stub/incubator concept, but initiated by **curiosity**, not just missing references

3. **Position Finding**: Where does this fit in my existing knowledge?
   - Solution: Embeddings + graph traversal. "This new concept is similar to X, differs from Y, extends Z"

4. **Educational Layers**: Not just "what is friction?" but "how does the author want me to learn about friction?"
   - Solution: **Lenses**! The `_lenses/` folder in the vault is meant for exactly this:
     - `lens-nlp.md` = NLP-style modeling
     - `lens-dbm.md` = DBM-style modeling
     - `lens-pedagogical.md` = Educational structure modeling

The pipeline should support:
```
Source → Process through Lens → Output structured according to that lens
```

So the same coaching book could produce:
- **NLP lens**: Techniques, presuppositions, strategies, anchors
- **DBM lens**: Models, distinctions, replications, generating
- **Pedagogical lens**: Prerequisites, learning objectives, assessments

**This is not implemented yet.** We have the folder. We need to wire lenses into the extraction prompt.

And THAN what do we do with all that knowledge once we would have it with a clear educational mindset behind the knowledge extraction? 

Its already in the vault as folder - maybe should be better in a separate folder outcomes or something like that. We can create flashcars, learning paths, microlearnings, my love business fable stories, quizees etc etc. Which than become knowledge items on its own - they are all in the Zettelkasten. So our creation become the source for new creations. Eventually feedback will play role. 

**A: Knowledge → Outputs → New Knowledge**

Yes! The vault has these folders ready:
- `flashcards/` - Spaced repetition cards
- `learning_paths/` - Structured journeys
- `microlearnings/` - 5-7 minute modules
- `stories/` - Business fables
- `quizzes/` - Assessments

The flow should be:
```
Knowledge Notes (concepts, procedures, principles)
       ↓
Generation Agents (story-writer, quiz-maker, flashcard-creator)
       ↓
Output Artifacts (stories, quizzes, flashcards)
       ↓
These ARE knowledge items → link back → become sources for more
```

And with feedback:
```
User studies flashcard → "This was confusing"
       ↓
Feedback stored in vault
       ↓
Next generation: "The previous version was confusing because..."
       ↓
Improved artifact
```

**This is Phase 2.** Phase 1 (current) = extraction. Phase 2 = generation. Phase 3 = feedback loop.


One last remark: I really do not understand how RUNG cannot be regognized as a special term. I am German, maybe my issue. Is that a generic term any native speaker understands? And if not, why the heck the LLM does not rename this? Like step, or phase or whatever. (Hint it is in the outcome ladder)...

**A: About "RUNG"**

"Rung" is an English word meaning a **step on a ladder** (die Sprosse). Most native speakers knows it, but it's a bit formal/literary. More common would be "step" or "level."

In the context of "Outcome Ladder," using "rung" is actually **clever** - it's the metaphor-consistent term. But the LLM should recognize it as:
- Part of a named model: "Outcome Ladder with Rungs A, B, C"
- A specialized term in this context

**Why it failed:**
1. The extractor might not have seen enough context to recognize "Rung A" as part of the Outcome Ladder model
2. The prompt might not emphasize looking for "metaphor-consistent terminology"

**Fix**: Update the extractor prompt to include:
```
Look for domain-specific vocabulary that the author uses consistently.
If the author uses a metaphor (ladder, wheel, loop), extract related terms
(rung, spoke, iteration) as part of that model, not as generic words.
```

Or: the modeler should output:
```yaml
id: concept-outcome-ladder
related_terms: ["Rung A", "Rung B", "Rung C", "rung"]
```

Then we'd recognize "Rung" as belonging to this concept, not floating orphaned.

---

## Summary: What We Learned

| Insight | Action Item |
|---------|-------------|
| Too many LLM calls for chunking | Add `fast_mode` for small sources |
| Sliding window is the right approach | Replace extract→model with `model_bundle` |
| Need embeddings for resolution | Add vector DB + embedding layer |
| Stubs need their own folder | Create `stubs/` and promote to real folders |
| Author's structure gets lost | Store and preserve source hierarchy |
| Lenses are unused | Wire lenses into extraction prompts |
| "RUNG" missed as term | Improve metaphor-aware extraction |

Would you like me to create a PRD or implementation plan for any of these?



MY FINAL COMMENT:
Iw rite it directly here - if I would have developer presenting me a solution and when I challenge things telling me: yeah, that what out itention was, but we di not implement it or we do not use it (you mentioned a couple of time the old runbook): I would end the meeting and send him/her back and tell or yell: do you dear to come back with a half finished solution? When we do milestone your goal is not to do like you did, but to DO IT and test it, and get the ideas behind it running. 

SO yes, implement all whats discussed here. Looking forward to see a FINISHED phase 1. 


Oh one more thing: my request to check if a source file is useful come from the very first tried where you selected a NOTE TO THE READER as source file for the project and the modeller modeled that as if it was real content. See the booksample. Or the content directory suddenly became the source of 100 concepts....

