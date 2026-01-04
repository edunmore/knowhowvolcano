# FULLDOCV3: Research System Documentation (Post-Fix)

**Date**: 2026-01-04  
**Status**: MVP-1 Complete, Verified Working  
**Last Successful Run**: `run-2026-01-04T18-59-51-750Z`  
**Source File**: `booksample/006_1_what_is_coaching_with_descriptions.md`

---

## 1. Executive Summary

The Research Pipeline is now **fully functional** after implementing 5 critical fixes from `PRDV2/nextsteps.md`. The system successfully:
- Ingests source documents
- Extracts knowledge candidates (concepts, principles, misconceptions)
- Resolves duplicates against existing vault
- Models structured notes with proper grounding
- Verifies schema compliance and grounding
- Generates stories for key concepts

### Fixes Applied (2026-01-04)
| # | Issue | Fix |
|---|-------|-----|
| 1.1 | `derived_from` only in body | Now required in YAML frontmatter |
| 1.2 | Placeholder deadlock | Gap Statement format replaces bare placeholders |
| 2 | Context starvation | ±2000 char window around quote |
| 3 | Cross-type merges | Type validation blocks concept→principle merges |
| 4 | Retry loop useless | Structured repair instructions on retry |

---

## 2. Complete Pipeline Loop (One Example)

### Step 1: Ingestion
**Agent**: `Ingestor`  
**Prompt**: `prompt-ingest.md`

**Input**: `booksample/006_1_what_is_coaching_with_descriptions.md`

**Prompt Sent to LLM**:
```
<system>
You are an Ingestion Agent.
Analyze the following text fragment (start of file) and produce YAML frontmatter for a "source_anchor" note.

Schema (YAML):
---
id: source-<safe-slug-from-title>
type: source_anchor
title: <Title Case>
author: <Author Name or Unknown>
url: <file-path-or-url>
tags: [source, unread]
---

Do not output markdown code blocks. Output ONLY the raw YAML.
</system>

File Name: 006_1_what_is_coaching_with_descriptions.md
Content Preview: (First 2000 chars of file...)
```

**Output Created**: `vault/sources/source-what-is-coaching-with-descriptions.md`
```yaml
---
id: source-what-is-coaching-with-descriptions
type: source_anchor
title: What Is Coaching With Descriptions
author: Unknown
url: /home/mac/projects/knowhow1/booksample/006_1_what_is_coaching_with_descriptions.md
tags: [source, unread]
---
```

---

### Step 2: Extraction
**Agent**: `Extractor`  
**Prompt**: `prompt-extract-candidates.md`

**Input**: Full source text (~15000 chars)

**LLM Output** (JSON):
```json
[
  {
    "type": "principle",
    "name": "Coaching Focuses on Future Possibilities",
    "quote": "Coaching focuses on future possibilities, not past mistakes",
    "reason": "Core guiding principle..."
  },
  {
    "type": "concept",
    "name": "Coaching Definition",
    "quote": "Coaching is unlocking people's potential to maximize their own performance.",
    "reason": "Foundational definition..."
  },
  {
    "type": "concept",
    "name": "The Inner Game",
    "quote": "The word \"inner\" was used to indicate the player's internal state...",
    "reason": "Foundational concept for modern coaching..."
  },
  {
    "type": "principle",
    "name": "Inner Game Equation",
    "quote": "Performance = potential – interference",
    "reason": "Core heuristic..."
  },
  {
    "type": "misconception",
    "name": "Coaching Is Teaching",
    "quote": "Coaching is all about a journey and nothing about instruction or teaching.",
    "reason": "Corrects common misunderstanding..."
  },
  // ... 12 candidates total
]
```

---

### Step 3: Resolution
**Agent**: `Resolver`  
**Prompt**: `prompt-resolve-entities.md`

**Input**: 12 candidates + Vault Index (empty for fresh run)

**Output**: All mapped to `CREATE` (no existing notes to merge with)

---

### Step 4: Modeling (Per Candidate)
**Agent**: `Modeler`  
**Prompt**: `prompt-model-artifact.md`

**Key Improvement**: Now receives **±2000 char context window**, not just the quote.

**Sample Prompt Sent** (for "Coaching Definition"):
```markdown
You are an Education Modeler.

Your task: write a **concept** note for the entity "**Coaching Definition**".

## Non-negotiable rules
1) GROUNDING: You must ONLY use the provided Source Text...
2) FRONTMATTER CONTRACT (CRITICAL): Must include derived_from in YAML...
3) QUOTE LIMIT: ≤30 words...
4) MERGE MODE: If existing_content provided...
5) NO PLACEHOLDER-ONLY SECTIONS: Use GAP STATEMENT FORMAT...

## Source Text
```text
(±2000 chars around the quote "Coaching is unlocking people's potential...")
```

## Output requirements
- Output ONLY the Markdown note content...
```

**Output Created**: `vault/concepts/concept-coaching-definition.md`
```yaml
---
id: concept-coaching-definition
type: concept
tags: [concept, extracted]
derived_from: ["source-what-is-coaching-with-descriptions"]
---
# Coaching Definition

## Definition
Coaching is unlocking people's potential to maximize their own performance. 
It is a process focused on future possibilities, centered on helping 
individuals learn and discover from within rather than being instructed.

## Operationalization
Not specified in this source. Open questions: (1) What specific 
observable actions distinguish coaching from instruction? (2) How can 
the reduction of 'interference' be measured in practice?

## Boundary conditions
Coaching is explicitly contrasted with instruction, teaching, and 
technical input. It applies when the objective is to foster the 
coachee's own discovery and learning capability.

## Links
Derived from: [[source-what-is-coaching-with-descriptions]]
```

---

### Step 5: Verification (Per Candidate)
**Agent**: `Verifier`  
**Prompts**: `prompt-verify-note.md` + `prompt-verify-grounding.md`

**Schema Check Output**:
```json
{
  "pass": true,
  "issues": []
}
```

**Grounding Check Output**:
```json
{
  "pass": true,
  "issues": []
}
```

**Log**: `✅ Verification PASSED for concept-coaching-definition.md`

---

### Step 6: Linking
**Agent**: `Linker`  
**Prompt**: `prompt-create-stub.md` (only if broken links found)

**Result**: `Found 0 missing link targets.` (No stubs needed)

---

### Step 7: Indexing
**Agent**: `Indexer`

**Output**:
- `vault/_index/notes.json` (13 notes indexed)
- `vault/_index/backlinks.json` (graph connections)

---

### Step 8: Storytelling
**Agent**: `Storyteller`  
**Prompt**: `prompt-storyteller-v1.md`

**Input**: Primary concept = "Coaching Definition"

**Prompt Sent**:
```markdown
You are the Storyteller.

**Goal**: Write a business fable to teach: [[Coaching Definition]].

**Available Knowledge (Context):**
- concept-acorn-analogy-for-human-potential
- concept-coaching-as-adult-learning
- concept-coaching-definition
- concept-foundation-of-coaching-awareness-and-responsibility
- concept-maslow-s-hierarchy-of-needs
- concept-self-belief
- concept-the-inner-game

**Output Requirements:**
1. Story (500 words)
2. Storyboard (5-10 beats)
3. Microlearning (Hook, Core Idea, Quick Check, Tiny Practice)
```

**Output Created**: `vault/stories/story-coaching-definition.md`

---

## 3. Current Prompt Inventory

| Prompt | Phase | Write? | Execution |
|--------|-------|--------|-----------|
| `prompt-ingest.md` | 1 | ✅ Creates `source-*.md` | Once per file |
| `prompt-extract-candidates.md` | 2 | ❌ Read-only | Once per file |
| `prompt-resolve-entities.md` | 2.5 | ❌ Read-only | Once per file |
| `prompt-model-artifact.md` | 3 | ✅ Creates/Updates notes | Per candidate |
| `prompt-verify-note.md` | 4 | ❌ Read-only | Per candidate |
| `prompt-verify-grounding.md` | 4 | ❌ Read-only | Per candidate |
| `prompt-create-stub.md` | 5 | ✅ Creates stubs | Per broken link |
| `prompt-storyteller-v1.md` | 6 | ✅ Creates stories | Per primary concept |

---

## 4. Generated Vault Contents (This Run)

### Sources (1)
- `source-what-is-coaching-with-descriptions.md`

### Concepts (7)
- `concept-coaching-definition.md`
- `concept-the-inner-game.md`
- `concept-acorn-analogy-for-human-potential.md`
- `concept-maslow-s-hierarchy-of-needs.md`
- `concept-self-belief.md`
- `concept-coaching-as-adult-learning.md`
- `concept-foundation-of-coaching-awareness-and-responsibility.md`

### Principles (4)
- `principle-coaching-focuses-on-future-possibilities.md`
- `principle-inner-game-equation.md`
- `principle-coaching-expertise-vs-subject-expertise.md`
- `principle-telling-negates-choice-and-demotivates.md`

### Misconceptions (1)
- `misconception-coaching-is-teaching.md`

### Stories (1)
- `story-coaching-definition.md`

---

## 5. PRD Completion Status

| Milestone | Status | Notes |
|-----------|--------|-------|
| MVP-1: Vault + Index + Stub | ✅ Complete | All core functionality working |
| MVP-2: Education Pack | 🟡 Partial | Stories work; Activity/Assessment not implemented |
| MVP-3: Curation | ❌ Not started | Aliases, redirects, taxonomy |
| MVP-4: Prompt Evolution | ❌ Not started | Eval corpus, regression runs |
| MVP-5: Regression Harness | ❌ Not started | Promotion gates |

---

## 6. Known Limitations

1. **Resolver Scalability**: Sends full vault index to LLM. Will fail >1000 notes.
   - **Fix**: Implement vector search / fuzzy prefilter.

2. **No Activity/Assessment Generation**: MVP-2 incomplete.

3. **No Learning Objectives**: Stories not tied to formal `learning_objective` notes.

---

## 7. CLI Usage

```bash
# Run pipeline on a source file
npx tsx src/systems/research/cli.ts ingest \
  --file booksample/006_1_what_is_coaching_with_descriptions.md \
  --provider deepseek \
  --verbose

# Providers available: azure-gpt52, deepseek, ollama
```
