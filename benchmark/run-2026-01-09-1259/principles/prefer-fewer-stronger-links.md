---
verified: true
verified_at: 2026-01-09T12:00:43.910Z
id: prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge network", "conceptual linking", "cognitive noise", "prerequisite structure", "note-taking system"]
---
# Prefer Fewer, Stronger Links

## Rule
When building a knowledge system, one should create a limited number of links that connect to stable, core concepts rather than linking every possible term, as this reduces noise and aids navigation.

## Rationale
A system should connect ideas to allow a learner or author to move from one note to the next without reading everything. However, linking every noun creates noise and hinders this goal. Links are most effective when they point to foundational [[Stable Concept|stable concepts]], named models, or repeated [[Prerequisite|prerequisites]].

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]], [[Calibration Loop]]

## LINK_INTENTS
```json
{
  "note_id": "prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["core concept", "fundamental idea", "named model"],
      "reason": "The principle explicitly states that links should point to stable concepts or named models."
    },
    {
      "target_title": "Prerequisite",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["prerequisite knowledge", "foundational knowledge", "repeated concept"],
      "reason": "The principle identifies repeated prerequisites as a key type of content that should be linked."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning friction"],
      "reason": "The principle of reducing linking noise aligns with the overarching goal of the source text to manage cognitive friction in learning design."
    }
  ]
}