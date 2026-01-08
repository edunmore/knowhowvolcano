---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When designing a [[Note System]], create links only to [[Stable Concept|stable concepts]], [[Named Model|named models]], or repeated [[Prerequisite]]s, rather than linking every noun. Plain text should be used for everything else until a concept proves its usefulness.

## Rationale
This principle reduces noise and increases navigability. A system should connect ideas so a learner or author can move from one note to the next without reading everything, but excessive linking creates clutter. Strong links point to foundational, reusable constructs that support [[Cognitive Load]] management and efficient knowledge retrieval.

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
      "intent_type": "tool",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "A core domain entity representing the knowledge management system being designed."
    },
    {
      "anchor_text": "stable concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "A key construct for determining what merits a link, contrasted with transient ideas."
    },
    {
      "anchor_text": "named models",
      "target_title": "Named Model",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "A specific type of stable construct, like frameworks or techniques, that should be linked."
    },
    {
      "anchor_text": "Prerequisite",
      "target_title": "Prerequisite",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "A learner-friction term; concepts a learner is assumed to know, which are candidates for linking."
    },
    {
      "anchor_text": "Cognitive Load",
      "target_title": "Cognitive Load",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Explicitly mentioned as a background idea; linking principles relate to managing mental effort."
    }
  ]
}