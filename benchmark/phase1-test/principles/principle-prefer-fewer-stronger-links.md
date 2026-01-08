---
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Prefer Fewer, Stronger Links

## Rule
In a note system designed for learning, you should connect ideas with a small number of robust [[Wiki Links]] that point to stable, important concepts. Avoid linking every noun, as this creates noise and increases [[Cognitive Load]].

## Rationale
The principle is grounded in the goal of a note system: to enable a learner or author to navigate from one [[Atomic Note]] to the next without having to read everything. Linking every term creates [[Information Friction]] and dilutes the value of connections. Stronger links are those that point to foundational, reusable constructs like named [[Mental Model|Models]], [[Stable Concept|Stable Concepts]], or repeated [[Prerequisite Knowledge]]. This selective linking reduces noise and focuses the learner's attention on the most important conceptual relationships, supporting the overall aim of reducing [[Friction Budget]] expenditure and aiding [[Knowledge Transfer]].

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
      "confidence": 0.8,
      "reason": "A core tool for connecting notes in a knowledge system."
    },
    {
      "anchor_text": "Cognitive Load",
      "target_title": "Cognitive Load",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Explicitly mentioned as a background idea the chapter relies on."
    },
    {
      "anchor_text": "Atomic Note",
      "target_title": "Atomic Note",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "Implied by the discussion of a 'note system' and moving between notes."
    },
    {
      "anchor_text": "Information Friction",
      "target_title": "Information Friction",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.65,
      "reason": "A construct describing the 'noise' created by excessive linking."
    },
    {
      "anchor_text": "Mental Model",
      "target_title": "Mental Model",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.75,
      "reason": "Linked to the 'named models' that should be prioritized for linking."
    },
    {
      "anchor_text": "Stable Concept",
      "target_title": "Stable Concept",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Directly named in the source as a target for stronger links."
    },
    {
      "anchor_text": "Prerequisite Knowledge",
      "target_title": "Prerequisite Knowledge",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "Directly named in the source as a target for stronger links."
    },
    {
      "anchor_text": "Friction Budget",
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "A core model from the source text; linking noise consumes this budget."
    },
    {
      "anchor_text": "Knowledge Transfer",
      "target_title": "Knowledge Transfer",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "The ultimate goal of the learning system the principle supports."
    }
  ]
}