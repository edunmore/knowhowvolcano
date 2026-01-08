# Add-on PRD — Emergent Zettelkasten Layer (Folgezettel Strands, Trails, MOCs, Bridge Notes) (v1.3)

Date: 2026-01-06  
Applies to: Education Zettelkasten system (existing implementation)  
Compatible with: `--vault` domain vaults, vault primers (v1.1), runbooks (v1.2), chunk gating/windowing (v0.5), lenses (v0.6), round-trip eval (v1.0)

## 1. Why this add-on exists

The current system is strong at “typed notes + links,” but it misses the Zettelkasten property that produces *emergent thinking*: the ability to traverse lines of thought, branch them organically, and generate new insights via curated adjacency.

This add-on introduces a second organizational layer on top of semantic links:
- **Folgezettel Strands**: ordered, branching “thought lines” with stable, human-friendly addresses (Luhmann-style) *per strand*
- **Trails**: ordered educational sequences (microlearning/lesson paths) that can reuse the same atomic notes
- **Structure Notes / MOCs**: curated hubs that provide multiple entry routes without hierarchy
- **Bridge Notes**: small connective notes that explain why two ideas belong together (the “synapse” layer)
- **Link rationale edges**: machine-readable reason-for-link so navigation and MOCs aren’t built on co-mention noise

Result: a vault becomes a walkable “forest of ideas,” not just a set of categorized pages.

## 2. Definitions

### 2.1 Semantic links
Normal cross-links between notes, annotated with relationship type + rationale (e.g., prerequisite, contrasts_with).

### 2.2 Folgezettel strand
A **strand** is an ordered sequence of note references that represents a developing line of thought. A strand supports branching. A note can appear in multiple strands.

The **Folgezettel address** (e.g., `1a1b`) is a stable *display address within a strand*. It is not the global note id.

### 2.3 Trail
A **trail** is an ordered learning sequence designed for consumption (microlearning, syllabus). It can point to notes and/or generated artifacts (stories, exercises). Trails are allowed to overlap and reuse notes.

### 2.4 MOC / Structure note
A **Map of Content** is a curated navigation note that groups related notes and explains relationships (not only a link list).

### 2.5 Bridge note
A **bridge note** is a short permanent note whose primary purpose is to connect two or more notes with an explicit claim (“A influences B because …”).

## 3. Vault additions (files/folders)

Recommended (not mandatory) layout inside a domain vault:

- `slipbox/` — permanent notes (atomic ideas), regardless of type
- `slipbox/strands/` — Folgezettel strands (structured files)
- `slipbox/trails/` — educational trails
- `slipbox/mocs/` — MOCs / structure notes
- `slipbox/bridges/` — bridge notes (connective tissue)
- `_graph/edges.jsonl` — optional centralized semantic edge store (append-only)

You may keep existing folders (e.g., `concepts/**`) but the system must treat them as a *storage detail*, not the main navigation mechanism.

## 4. Data model

### 4.1 Note identity
Notes keep stable ids (timestamps/uuids/slug-based ids). Folgezettel addresses are separate and per strand.

### 4.2 Strand schema (required)
Each strand is a single file (YAML or JSON) that contains:
- metadata: strand id, title, domain, created_at
- nodes: ordered list
- branches: optional branch pointers (branch starts from a node index)

Each node must store:
- `note_id`
- `fz` (Folgezettel address label for this node within this strand)
- `rationale` (why it follows the previous node)
- optional `tags` and `intent` (e.g., “argument”, “example”, “counterpoint”)

Schema: `schemas/strand.schema.json`.

### 4.3 Semantic link edges (required as metadata, optional centralized store)
Every *new link* created by modeler/gardener should be captured as an “edge” with:
- from_note_id, to_note_id (or to_title if unresolved)
- relation_type
- rationale (1 sentence)
- provenance: `source_note_id` or `run_id`
- confidence

Schema: `schemas/edge.schema.json`.

Implementation options:
1) Store edges inside note frontmatter (`links_out:` with objects).
2) Append to `_graph/edges.jsonl` (recommended for scalability and analytics).

## 5. Generation steps (new pipeline capabilities)

This add-on introduces three new “post-model” steps, typically run per batch:

### 5.1 Link Rationalization Pass (L1)
Goal: ensure each outgoing link has a relation type + rationale.
Input: newly created/updated notes.
Output:
- updated note content (inline `[[...]]` links remain)
- edges emitted to `_graph/edges.jsonl` (optional)

### 5.2 Gardener Pass (L2)
Goal: create/update MOCs and strands/trails for navigability.
Input: recent notes + edge store + domain primer.
Outputs:
- 1..N MOC updates
- 1..N strand updates (or creation of a new strand for the book/topic)
- optional trail updates

The gardener is allowed to be conservative; it can create *small* MOCs and expand them later.

### 5.3 Bridge Builder Pass (L3)
Goal: create bridge notes that connect high-value pairs.
Input: recent notes + edges + retrieval of existing relevant notes (top-k).
Output:
- 2..10 bridge notes per batch (configurable)
- bridge notes are inserted into at least one strand and referenced by at least one MOC

## 6. Folgezettel addressing algorithm (per strand)

The system must support the “insert/branch forever” behavior without renumbering existing nodes.

Design choice: ordering is stored explicitly in the strand file (the list). Addresses are stable display labels that show local derivation.

Algorithm (deterministic, simple):
- The first node in a strand gets `1` (or configurable base number).
- When adding a node after node with address `A`, assign the next unused suffix under `A`:
  - If `A + "a"` unused -> use that.
  - Else `A + "b"`, then `c`, etc.
  - If you run out of single letters or want deeper precision, allow `A + "a1"`, `A + "a2"`.
- If you branch (explicit branch start), the first node of the branch is still `A + "a"` style; the strand file records it as a branch for UI purposes.

This yields the “every node can start a new line” property while keeping addresses stable.

Optional “alternating” style (more Luhmann-like):
- enforce alternation between alpha and numeric suffixes when extending beyond one level (configurable).

## 7. Traversal UX (CLI/API)

Even before a web UI, the system must provide traversal operations for strands and trails:

- `strand list --vault ...`
- `strand show <strand_id>`
- `strand next <strand_id> <note_id>`
- `strand prev <strand_id> <note_id>`
- `strand branch <strand_id> <note_id> --title "...“`
- `trail show <trail_id>`

The traversal layer is what creates “stumble-upon” behavior: you can walk forward/backward through a thought line, then jump via semantic links.

## 8. How this supports “developing new knowledge”

Once the navigation layer exists, new-knowledge generation becomes measurable and safe:
- Bridge notes are *new claims* created by the system, explicitly separated from source-derived notes.
- Trails are *new educational constructions* that reuse atomic notes.
- MOCs reflect *emerging structure* (clusters and relationships) without forcing hierarchy.

To keep provenance clean, every bridge note must declare its origin as “synthesized from notes,” not “from source text.”

## 9. Runbook integration (v1.2)

Add three step types:
- `rationalize_links`
- `garden_structure`
- `build_bridges`

Example runbook snippet is included in this zip.

## 10. Acceptance criteria

A) After ingesting a book (or N chunks), the vault contains:
- atomic notes with inline links
- edges with relation_type + rationale
- at least one MOC
- at least one strand with 10+ nodes (configurable)
- at least two bridge notes inserted into a strand

B) Traversal works: given a strand id and a note id, the system returns prev/next reliably.

C) The system can create branches without renumbering existing strand nodes.

D) Bridge notes are clearly marked as synthesized and do not pretend to be verbatim from sources.

E) Token/cost remains bounded using the existing gating/windowing policies.

## 11. Milestones

### M1 — Schemas + storage
Deliver:
- strand schema
- edge schema
- vault folder conventions
Acceptance:
- validator accepts strand files and edge records.

### M2 — Link rationalization (L1)
Deliver:
- modeler/gardener outputs edges with rationale
- optional `_graph/edges.jsonl`
Acceptance:
- edges can be queried for MOC building.

### M3 — Gardener (L2) for MOCs + strands
Deliver:
- create/update MOCs
- create/update strands
- CLI traversal primitives
Acceptance:
- user can list strands and traverse them.

### M4 — Bridge builder (L3)
Deliver:
- generate bridge notes + insert into strands + reference from MOCs
Acceptance:
- bridge notes exist, are navigable, and show rationale.

### M5 — Trails (optional but recommended)
Deliver:
- trail schema + generation for microlearning sequences
Acceptance:
- at least one trail generated per batch run (configurable).
