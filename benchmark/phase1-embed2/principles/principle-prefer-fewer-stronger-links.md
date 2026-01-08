---
verified: true
verified_at: 2026-01-08T18:53:08.904Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge structure", "conceptual linking", "cognitive load", "prerequisite knowledge", "information architecture"]
---
# Prefer Fewer, Stronger Links

## Rule
In a note system for learning, create connections only between stable concepts, named models, or repeated prerequisites, rather than linking every possible term.

## Rationale
The principle states that a system should connect ideas so a learner can navigate from one note to the next without reading everything. However, excessive linking creates cognitive noise and reduces utility. Strong, meaningful links support efficient navigation and knowledge integration, while weak links obscure the structure.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]], [[Outcome Ladder]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "This principle helps manage cognitive load (friction) by reducing navigational noise in a learning system."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "Effective linking supports progression through learning stages by connecting core, stable concepts."
    }
  ]
}