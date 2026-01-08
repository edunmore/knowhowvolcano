---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When building a note system for learning, connect ideas with fewer, stronger [[Wiki Links]]. Links should point to [[Stable Concepts]], [[Named Models]], or repeated [[Prerequisite Concepts]]. Avoid linking every noun, as this creates noise. Unproven or less critical terms can remain as plain text.

## Rationale
This principle prioritizes navigational efficiency and reduces cognitive noise. The goal is to enable a learner or author to move from one note to the next without having to read everything. Linking only the most stable and foundational concepts creates a more useful and less cluttered knowledge structure, which supports better learning and retrieval.

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "anchor_text": "Wiki Links",
      "target_title": "Wiki Links",
      "intent_type": "tool",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "A core tool for building interconnected note systems, directly referenced in the principle."
    },
    {
      "anchor_text": "Stable Concepts",
      "target_title": "Stable Concepts",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a primary target for strong links, a key construct in the principle's application."
    },
    {
      "anchor_text": "Named Models",
      "target_title": "Named Models",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Explicitly listed as a type of entity that merits a stronger link."
    },
    {
      "anchor_text": "Prerequisite Concepts",
      "target_title": "Prerequisite Concepts",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Explicitly listed as a type of concept that should be linked when repeated."
    }
  ]
}