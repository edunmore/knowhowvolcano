---
verified: true
verified_at: 2026-01-10T19:50:15.372Z
id: prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge network", "conceptual linking", "cognitive load", "note-taking system", "prerequisite structure"]
---
# Prefer Fewer, Stronger Links

## Rule
When constructing a system of notes or learning materials, create links only to stable concepts, named models, or repeated prerequisites, rather than linking every possible term.

## Rationale
Excessive linking creates noise and cognitive overhead, hindering navigation and understanding. A system should connect ideas so a learner can move between notes efficiently, but this requires prioritizing links that are foundational and reusable. Links should be reserved for concepts that serve as clear anchor points within the knowledge structure.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]], [[Outcome Ladder]]

## LINK_INTENTS
```json
{
  "note_id": "prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "This principle directly relates to managing cognitive load (friction) by reducing noisy links in an information system."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["learning progression", "performance levels", "skill transfer"],
      "reason": "Both concepts are part of the author's toolbox for designing effective learning, focusing on clear, transferable outcomes and structures."
    }
  ]
}