---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
In a [[Note System]], create links only to [[Stable Concept|stable concepts]], [[Named Model|named models]], or repeated [[Prerequisite|prerequisites]]. Avoid linking every noun, as this creates noise; leave other terms as plain text until they prove useful for navigation.

## Rationale
The purpose of linking is to enable a learner or author to move from one [[Note System|note]] to the next without reading everything. Over-linking creates [[Friction Budget|friction]] and noise, which hinders this navigational goal. Stronger links to core, stable ideas are more valuable than numerous weak links.

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
      "reason": "The principle is specifically about designing links within a note-taking or knowledge system."
    },
    {
      "anchor_text": "stable concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key criterion for what should be linked."
    },
    {
      "anchor_text": "named models",
      "target_title": "Named Model",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key criterion for what should be linked."
    },
    {
      "anchor_text": "prerequisites",
      "target_title": "Prerequisite",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key criterion for what should be linked."
    },
    {
      "anchor_text": "friction",
      "target_title": "Friction Budget",
      "intent_type": "metaphor_construct",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Noise from over-linking is directly related to the concept of cognitive friction introduced in the source."
    },
    {
      "anchor_text": "note",
      "target_title": "Note System",
      "intent_type": "tool",
      "stub_policy": "ignore",
      "confidence": 0.3,
      "reason": "Already linked earlier; this is a generic reference."
    }
  ]
}