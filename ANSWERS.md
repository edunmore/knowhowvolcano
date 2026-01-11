# Answers to Questions

## Q1: Default Vault Generation

**Current Behavior**: When `--vault <path>` points to an empty/new directory, the system:
1. Creates standard layout via `ensureVaultLayout()` 
2. Generates `vault.json` with a hash-based ID and generic title "Knowledge Vault"
3. Creates a default `primer.json` with generic settings

**Your Vision (Not Yet Implemented)**: Interactive vault initialization would:
- Ask domain questions (e.g., "What is this vault about?")
- Set domain-specific primer (scope_in, scope_out, style rules)
- Configure default models and token budgets

**Recommendation**: Add `vault init --interactive` command that prompts for domain info and generates a customized primer.

---

### USER COMMENT: "the vault has prompts and much more data - where does this come from? We must have a source vault for this????"

**Answer**: Yes! There IS a source/template vault:

**Location**: `src/systems/research/vault/`

This contains:
- `_system/prompts/` - All agent prompts
- `_system/schemas/` - JSON schemas
- `_system/primer.json` - Default domain primer

**Current Flow**:
1. User runs `--vault ./new-vault`
2. `ensureVaultLayout()` creates directory structure
3. **MISSING**: We don't auto-copy prompts from template vault!

**Fix Required**: The pipeline must copy `src/systems/research/vault/_system/*` to new vaults. Currently this is done manually before running.

**Better Design**:
```
src/systems/research/
├── vault-template/          # Renamed from "vault"
│   └── _system/
│       ├── prompts/
│       ├── schemas/
│       └── primer.json
└── utils/vault-utils.ts     # ensureVaultLayout() should copy from template
```

---

## Q2: Links in Stories vs Knowledge Notes

**Current Behavior**:
- **Stories**: Include `[[concept-xxx]]` wikilinks inline (for context)
- **Concepts/Principles/etc.**: Only have `[[source-xxx]]` in the `derived_from` + Links section

**Your Vision**: Notes SHOULD have rich inline links like:
```markdown
The Inner Game is a concept from [[Timothy Gallwey]] describing...
...reducing [[Interference]], so that learning...
```

**Root Cause**: The `prompt-model-artifact.md` doesn't instruct the LLM to insert wikilinks inline. It only says to include derived_from in YAML.

---

### USER COMMENT: "we have a Zettelkasten in mind..."

**Your Architecture Vision** (TWO-PHASE LINK RESOLUTION):

**Phase 1: Modeler generates PLAIN TEXT with CANDIDATES**
- LLM writes content naturally, no brackets
- Separate section lists potential link targets
- Example output:
  ```markdown
  ## Definition
  The Inner Game is a concept from Timothy Gallwey describing...
  
  ## Link Candidates
  - Timothy Gallwey (named_entity)
  - Inner Game Equation (technical_term)
  - Interference (technical_term)
  ```

**Phase 2: Linker RESOLVES candidates against vault**
- Reads vault index (`_index/notes.json`)
- For each candidate:
  - If exists in vault → insert `[[concept-xxx]]` inline
  - If NOT exists → create stub and insert link
- This is TRUE Zettelkasten: links emerge from vault state, not LLM hallucination

**Benefits**:
1. LLM doesn't need to know vault structure
2. Links are CONSISTENT with actual vault
3. Stubs are created automatically
4. No broken links

**Implementation Plan**:
1. Update `prompt-model-artifact.md` to output plain text + candidates list
2. Create new `link-resolver.ts` agent that:
   - Parses candidates from note
   - Matches against vault index
   - Injects `[[wikilinks]]` inline
   - Creates stubs for unresolved
3. Wire into orchestrator after modeler, before verification

---

## Q3: Chunking Status

**Current Behavior**: ❌ Chunking is NOT active in the pipeline. The full source text is sent to the Extractor.

**What's Built**: The infrastructure exists:
- `chunker.ts` - splits text, stores in `_sources/`
- `chunk-gate.ts` - routes via Ollama (SKIP/LIGHT_SCAN/FULL_MODEL)
- `window-assembler.ts` - creates PREV/CURRENT/NEXT windows

**What's Missing**: The `orchestrator.ts` doesn't call these functions yet. It still uses the old flow: ingest → extract → model.

**Fix Required**: Update `orchestrator.ts` to integrate the new chunking pipeline.

---

## Q4: Source Naming Without LLM

**Current Behavior**: Ingestor runs an LLM call just to generate a title for the source file.

**Your Vision**:
1. Store raw text in `_sources/<hash>/raw.md` (separate from vault knowledge)
2. Generate `source_id` deterministically from content hash
3. Create `source-<hash>.md` anchor with metadata (no LLM needed)
4. This enables "license-free vault" by excluding `_sources/`

**Status**: `chunker.ts` already implements `generateSourceId()` using SHA1 hash. The ingestor just needs to be updated to use it.

---

## Q5: Full Documentation Needed

**Request**: Document all parameters and vault-configurable options.

**Current Configurable Items**:
| Location | What |
|----------|------|
| CLI flags | `--vault`, `--provider`, `--runsDir`, `--verbose` |
| `primer.json` | domain, scope, style, step slices, token budgets |
| `vault.json` | vault_id, title, domain_tags |
| `_system/prompts/` | All agent prompts |
| `_system/schemas/` | Note type schemas |
| `_system/runbooks/` | Declarative workflows |

**Action**: I'll create a `CONFIGURATION.md` document.

---

## Q6: Hardcoded Values Audit

**Currently Hardcoded**:
| Item | Location | Should Be |
|------|----------|-----------|
| Note types list | `extractor.ts` | `primer.json` ontology |
| Token budgets | `primer-loader.ts` | Already in primer (but has defaults) |
| Provider selection | `cli.ts` | Could be `vault.json` default |
| Quote length limit (30 words) | `prompt-verify-note.md` | `primer.json` style rules |
| Retry count (2) | `orchestrator.ts` | `primer.json` or runbook |
| Window size (2000 chars) | `orchestrator.ts` | `primer.json` budgets |

**Action**: I'll create a checklist and migrate key items to vault config.

---

## Q7: Full Run Export

**Request**: Export complete run for external LLM evaluation.

**Current**: Runs are logged to `_runs/<run_id>/` with `log.md` and `manifest.json`.

**Enhancement Needed**:
1. Add `--export-full` flag to generate single `run_export.json`
2. Include: source text, all prompts used, all LLM responses, all created notes
3. Enable self-improvement cycle: empty vault → test input → run → external LLM review

---

## Priority Improvements

1. **[HIGH]** Fix inline linking in modeler prompt
2. **[HIGH]** Integrate chunking pipeline into orchestrator
3. **[MEDIUM]** Add deterministic source ID (no LLM for naming)
4. **[MEDIUM]** Create CONFIGURATION.md documentation
5. **[LOW]** Add run export functionality
