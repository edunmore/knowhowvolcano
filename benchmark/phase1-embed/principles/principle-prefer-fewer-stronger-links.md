---
verified: true
verified_at: 2026-01-08T18:44:28.939Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge structure", "concept mapping", "cognitive load", "prerequisite knowledge", "instructional design"]
---
# Prefer Fewer, Stronger Links

## Rule
In an educational note system, connect ideas with fewer but more meaningful links to stable concepts, named models, or repeated prerequisites, rather than linking every noun.

## Rationale
This principle reduces cognitive noise and facilitates navigation. A system should allow a learner to move from one note to the next efficiently. Linking every term creates noise, while focusing links on foundational concepts aids understanding and reduces [[cognitive load]] without requiring learners to read everything.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[cognitive load]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "cognitive load",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning efficiency"],
      "reason": "The principle aims to reduce noise, which is directly related to managing cognitive load in instructional design."
    }
  ]
}