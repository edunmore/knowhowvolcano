# Window Modeler Contract (Add-on)

Date: 2026-01-04

This contract modifies the modeler input for the chunk-streaming approach. The modeling call receives three labeled blocks and must treat CURRENT as authoritative evidence.

## Inputs
- PREV (supporting context)
- CURRENT (authoritative evidence)
- NEXT (supporting context)
- current_chunk_id (canonical provenance anchor)

## Rules
- Extract/model only what is supported by CURRENT.
- Use PREV/NEXT only to disambiguate or complete definitions spanning boundaries.
- If PREV/NEXT is used materially, include those chunk IDs in YAML derived_from.
- Prefer generating fewer, higher-confidence notes over exhaustive coverage.
- When evidence is missing for required sections, use the system's “Gap Statement” format (no placeholder-only sections).

## Provenance
- YAML derived_from must list chunk IDs actually used.
- Optional: include source_spans with char offsets if available.
