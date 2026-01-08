---
verified: true
verified_at: 2026-01-08T16:49:21.357Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
In a note system designed for learning, create links only to stable concepts, named models, or repeated prerequisites. Avoid linking every noun, as this creates noise and reduces navigational utility.

## Rationale
A system should allow a learner or author to move from one note to the next without reading everything. Links that point to core, stable ideas make this navigation meaningful and reduce cognitive load. Excessive linking dilutes the value of each connection and can overwhelm the learner, analogous to exceeding the [[Friction Budget]] in a learning unit.

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "anchor_text": "Friction Budget",
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Key concept from the source text used to explain the rationale for the principle."
    },
    {
      "anchor_text": "note system",
      "target_title": "Note System",
      "intent_type": "tool",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "Central tool for applying the principle, referenced generally."
    },
    {
      "anchor_text": "stable concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A key criterion for what should be linked, per the rule."
    },
    {
      "anchor_text": "named models",
      "target_title": "Named Model",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A key criterion for what should be linked, per the rule."
    },
    {
      "anchor_text": "prerequisites",
      "target_title": "Prerequisite",
      "intent_type": "prerequisite",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A key criterion for what should be linked, per the rule."
    },
    {
      "anchor_text": "cognitive load",
      "target_title": "Cognitive Load",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "Referenced in source as a background idea relevant to friction and learning design."
    }
  ]
}