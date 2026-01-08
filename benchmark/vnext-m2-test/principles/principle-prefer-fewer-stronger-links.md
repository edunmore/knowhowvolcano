---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
A [[Note System]] should connect ideas so that a learner (or author) can move from one note to the next without reading everything. Links should point to [[Stable Concepts]], [[Named Models]], or repeated [[Prerequisites]]. Avoid linking every noun, as this creates [[Noise]].

## Rationale
Creating too many links adds [[Cognitive Load]] and [[Friction]] without improving the transfer of knowledge. By prioritizing links to stable, foundational concepts, the system reduces noise and supports efficient navigation and learning.

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
      "confidence": 0.75,
      "reason": "Central tool being described for managing knowledge links."
    },
    {
      "anchor_text": "Stable Concepts",
      "target_title": "Stable Concepts",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key type of entity to link to for stronger connections."
    },
    {
      "anchor_text": "Named Models",
      "target_title": "Named Models",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key type of entity to link to for stronger connections."
    },
    {
      "anchor_text": "Prerequisites",
      "target_title": "Prerequisites",
      "intent_type": "prerequisite",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Identified as a key type of foundational knowledge to link to."
    },
    {
      "anchor_text": "Noise",
      "target_title": "Noise",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "Described as the negative outcome of linking every noun."
    },
    {
      "anchor_text": "Cognitive Load",
      "target_title": "Cognitive Load",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Referenced as a background idea; linking everything likely increases it."
    },
    {
      "anchor_text": "Friction",
      "target_title": "Friction",
      "intent_type": "metaphor_construct",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.85,
      "reason": "A core metaphor in the source; extra content raises friction without improving transfer."
    }
  ]
}