---
verified: true
verified_at: 2026-01-08T14:09:16.604Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When building a note system, create links only to stable concepts, named models, or repeated prerequisites. Avoid linking every noun, as this creates noise. Plain text should be used for concepts that have not yet proven their usefulness as connection points.

## Rationale
A well-connected note system should allow a learner or author to navigate from one idea to the next without having to read everything. Excessive linking undermines this goal by adding [[Cognitive Load]] and obscuring the most important conceptual relationships. Stronger links act as reliable pathways through knowledge.

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "anchor_text": "note system",
      "target_title": "Note System",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "A core construct for organizing knowledge, central to the principle's application."
    },
    {
      "anchor_text": "stable concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "A key criterion for what merits a link, contrasted with transient or minor terms."
    },
    {
      "anchor_text": "named models",
      "target_title": "Named Model",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Explicitly cited as a type of entity that should receive a link."
    },
    {
      "anchor_text": "prerequisites",
      "target_title": "Prerequisite",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.75,
      "reason": "Explicitly cited as a type of entity that should receive a link, especially if repeated."
    },
    {
      "anchor_text": "Cognitive Load",
      "target_title": "Cognitive Load",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Referenced in the source's 'More to learn' section; linking explains the rationale for reducing noise."
    }
  ]
}