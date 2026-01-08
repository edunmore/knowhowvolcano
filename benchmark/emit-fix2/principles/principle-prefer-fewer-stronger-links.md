---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
When building a [[Note System]], prioritize creating fewer connections that point to stable, high-value concepts like named models or repeated prerequisites, rather than linking every noun, which creates noise.

## Rationale
A well-designed note system should enable a learner or author to navigate from one note to another without having to read everything. Excessive linking dilutes this purpose by increasing cognitive [[Friction Budget|Friction]] without improving understanding or [[Transfer (Learning)|Transfer]]. Links are most effective when they connect to foundational [[Stable Concept|Stable Concepts]] that serve as reliable anchors for knowledge.

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
      "reason": "The principle is specifically about designing a system for organizing notes and knowledge."
    },
    {
      "anchor_text": "Friction",
      "target_title": "Friction Budget",
      "intent_type": "metric",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Friction is a core construct in the source text for measuring mental effort and learner engagement."
    },
    {
      "anchor_text": "Transfer",
      "target_title": "Transfer (Learning)",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Transfer is a key rung on the Outcome Ladder and a central goal of the learning design."
    },
    {
      "anchor_text": "Stable Concepts",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "The source text explicitly states that links should point to 'stable concepts,' making it a key construct for this principle."
    }
  ]
}