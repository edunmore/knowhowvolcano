# Add-on PRD — Domain Primer / Preamble Injection (v1.1)

Date: 2026-01-05  
Applies to: Education Zettelkasten system (existing implementation)  
Related: v0.9 dynamic `--vault` (domain vaults), v0.5 chunking/gating, v0.6 lenses, v1.0 round-trip with `--vault`

## 1. Goal

Add a **domain-specific primer** to each vault that provides persistent context about:
- what the vault is “about” (domain scope)
- preferred knowledge representation (note types + ontology)
- style and constraints (copyright-safe paraphrasing, grounding rules)
- evaluation focus (what “good” means in this domain)

The orchestrator must automatically inject this primer into every agent prompt, using a **token-budgeted** and **step-aware** mechanism (include only what is relevant to the current step).

## 2. Non-goals

- Building a full policy engine or prompt optimizer here.
- Auto-generating primers (can be added later).
- Making the primer a replacement for contracts/schemas (it complements them).

## 3. Primer artifacts

Each vault contains:

### 3.1 Human-readable primer
- `VAULT_ROOT/_system/primer.md`

### 3.2 Machine-readable primer (recommended)
- `VAULT_ROOT/_system/primer.json`

`primer.md` is for human editing and quick understanding.  
`primer.json` is used by the orchestrator to inject relevant subsets by step.

## 4. Injection rules

### 4.1 Mandatory injection
For every agent call, the orchestrator injects a “context header” built from:
- `primer.core` (always)
- a step-specific slice (e.g., `primer.steps.modeler`)
- optional lens slice (e.g., `primer.lenses.dbm`)

### 4.2 Token budget
To avoid primer bloat, define budgets (defaults; override per vault):

- `core_max_tokens`: 250
- `step_slice_max_tokens`: 300
- `total_primer_max_tokens`: 600

If `primer.md` is longer, the orchestrator must prefer `primer.json` slices or summarize down to budget (summarization can be LLM-based but should be cached per primer version hash).

### 4.3 Precedence / overrides
If a shared system template exists (optional, see v0.9 `--shared-system`), injection precedence is:

1) vault-local primer (`VAULT_ROOT/_system/primer.*`)  
2) shared primer (`SHARED_SYSTEM/_system/primer.*`) if present  
3) none

Vault-local overrides shared fields by key.

### 4.4 Step-aware selection
The orchestrator selects primer sections based on the current step:

- Gate: domain scope + what to skip + what “useful content” means in this domain
- Extract candidates: ontology and naming rules
- Resolve: ID policy, merge rules, alias policy, stub policy
- Modeler: modeling depth, required facets, link-marking policy
- Storyteller: style + constraints + what to teach + manifest requirements
- Verifiers: grounding strictness, disallowed hallucination patterns

## 5. Primer JSON schema

Store a structured JSON with explicit slices.

See `schemas/primer.schema.json`.

Minimum required fields:
- `domain.id`, `domain.title`, `domain.scope_in`, `domain.scope_out`
- `core` (short)
- `ontology.note_types` (list)
- `style.paraphrase_rules`
- `steps` (object with optional per-step slices)

## 6. Link-marking policy in the primer (important)

Domain primers should explicitly instruct the modeler to mark links even when unknown:
- if a term appears as presumed knowledge, create `[[Stub Title]]` link-intent
- do not resolve here; resolver/stub-pass handles it later

This single instruction typically increases link density and improves long-term Zettelkasten connectivity.

## 7. Implementation requirements

### 7.1 Orchestrator changes
- Add `loadPrimer(vaultRoot)` returning an object like: `core + stepSlice + lensSlice + meta`
- Add `renderPrimerHeader(...)` that produces a stable prompt prefix block
- Cache by `hash(primer.json + primer.md)`
- Include `primer_hash` and `primer_sections_included` in run report

### 7.2 Prompt template changes
Prompts should not hardcode domain context; they should assume primer exists.
Each prompt should include a placeholder comment like:
- “Domain primer is injected above. Do not restate it.”

### 7.3 Testing
Add step scenarios (v0.9) to validate that primer injection works:
- scenario asserts that the injected prompt contains the domain title and ontology snippet
- scenario asserts that changing primer changes `primer_hash` and affects outputs

## 8. Acceptance criteria

A) Running the same scenario in two different domain vaults (coaching vs negotiation) yields different stylistic and ontological biases without changing prompt files.

B) Token usage does not blow up: primer injection stays within configured budgets.

C) Run report includes primer hash and sections included.

D) Prompts become smaller/cleaner because domain assumptions move into primer.

## 9. Milestones

### M1 — Primer files + schema
- Add `primer.schema.json`
- Add example primers
Acceptance: vault loads primer and validates schema.

### M2 — Injection engine
- Orchestrator injects primer slices by step
- Budget enforcement + caching
Acceptance: all steps include primer header and report primer hash.

### M3 — Domain overrides
- Implement precedence for shared vs local primers (optional)
Acceptance: vault-local overrides shared as specified.

---

# Appendix: Recommended primer content checklist

Include:
- Domain scope (in/out)
- Target audience (e.g., “managers coaching reports”)
- Preferred note types and required facets (definition, operationalization, examples, pitfalls)
- Style constraints (paraphrase, no quotes, concise)
- Link marking and stub policy
- Evaluation focus (faithfulness, teachability, actionable steps)
