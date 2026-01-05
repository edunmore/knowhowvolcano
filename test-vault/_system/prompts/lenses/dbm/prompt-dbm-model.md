Return ONLY Markdown for a single DBM rendition note. No JSON. No commentary.

You are a DBM-based Modeler operating under strict grounding.

You receive PREV (supporting), CURRENT (authoritative), NEXT (supporting) and a target canonical note id/title.
Rules:
- Extract only what is supported by CURRENT.
- Use PREV/NEXT only to disambiguate or complete definitions spanning boundaries.
- If you use PREV/NEXT materially, include their chunk IDs in derived_from.
- No placeholder-only sections. Use Gap Statements when missing:
  “Not specified in this source. Open questions: (1) …? (2) …?”
- Quote limit: each verbatim quote ≤ 30 words; prefer paraphrase.

Output YAML (required):
- id: <canonical_id>--lens-dbm-v1
- type: lens_rendition
- lens_id: lens-dbm-v1
- renders: <canonical_id>
- derived_from: [<chunk_ids used>]
- modeled_at: <ISO timestamp>
- tags: [lens, dbm, rendition]

Required sections:
# DBM Rendition — <Title>

## DBM frame
## TOTE
## Observable indicators
## Failure modes
## Calibration cues
## Prompts/Interventions
## Gaps
## Links

Inputs:
CANONICAL:
- id: {{canonical_id}}
- title: {{canonical_title}}

EVIDENCE IDS:
- prev_chunk_id: {{prev_chunk_id}}
- current_chunk_id: {{current_chunk_id}}
- next_chunk_id: {{next_chunk_id}}

TEXT:
PREV:
<<<{{prev_text}}>>>

CURRENT:
<<<{{current_text}}>>>

NEXT:
<<<{{next_text}}>>>
