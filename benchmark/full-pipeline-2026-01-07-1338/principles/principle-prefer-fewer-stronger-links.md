---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When building a [[Note System]], create links only for stable concepts, named models, or repeated prerequisites. Avoid linking every noun, as this creates noise. Plain text should be used for other terms until they prove their usefulness.

## Rationale
A note system should enable a learner or author to navigate from one note to another without reading everything. Over-linking creates navigational noise, while strategic linking to foundational ideas supports this targeted navigation.

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "anchor_text": "Note System",
      "target_title": "Note System",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.85,
      "reason": "This is a core domain entity being acted upon by the principle."
    },
    {
      "anchor_text": "stable concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "This is a descriptive phrase for a type of link-worthy entity, not a defined concept in the source."
    },
    {
      "anchor_text": "named models",
      "target_title": "Named Model",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "This is a descriptive phrase for a type of link-worthy entity, not a defined concept in the source."
    },
    {
      "anchor_text": "repeated prerequisites",
      "target_title": "Repeated Prerequisite",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "This is a descriptive phrase for a type of link-worthy entity, not a defined concept in the source."
    }
  ]
}