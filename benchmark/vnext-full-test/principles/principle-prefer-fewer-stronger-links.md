---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When designing a note system, create links only to stable concepts, [[Named Models]], or repeated [[Prerequisite Concepts]]. Avoid linking every noun, as this creates noise. Plain text should be used for content that has not yet proven its utility for connection.

## Rationale
A note system should enable a learner or author to navigate from one note to the next without reading everything. Excessive linking creates noise and hinders this navigational clarity. Stronger links to foundational and stable ideas support effective [[Knowledge Calibration]] and reduce [[Cognitive Load]].

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "anchor_text": "Named Models",
      "target_title": "Named Models",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Source text explicitly lists 'named models' as a type of stable concept to link to."
    },
    {
      "anchor_text": "Prerequisite Concepts",
      "target_title": "Prerequisite Concepts",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Source text explicitly lists 'repeated prerequisites' as a type of stable concept to link to."
    },
    {
      "anchor_text": "note system",
      "target_title": "Note System",
      "intent_type": "tool",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "The principle is framed in the context of a note system, a tool for organizing knowledge."
    },
    {
      "anchor_text": "Knowledge Calibration",
      "target_title": "Knowledge Calibration",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "Calibration is a core learning process mentioned in the source; strong links support this process."
    },
    {
      "anchor_text": "Cognitive Load",
      "target_title": "Cognitive Load",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Explicitly listed as a background idea in the source text, and reducing noise aligns with managing cognitive load."
    }
  ]
}