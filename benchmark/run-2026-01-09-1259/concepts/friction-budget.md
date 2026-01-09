---
verified: true
verified_at: 2026-01-09T11:59:48.098Z
id: friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner effort", "deliberate practice", "instructional design", "mental effort"]
---
# Friction Budget

## Definition
The Friction Budget is a concept in instructional design representing the maximum amount of mental effort a learner can allocate to a learning unit before they disengage or resort to superficial strategies like guessing. It is a finite resource that must be managed to promote [[deliberate practice]].

## Key Components
The concept identifies specific factors that consume a learner's friction budget:
- **Terminological Load**: Introducing too many new terms at once.
- **Procedural Complexity**: Requiring too many steps to complete a task.
- **Interface Switching**: Demanding too much navigation between different screens or contexts.

## Application
The principle guides designers to allocate "friction" strategically, spending it only where it directly contributes to skill transfer, rather than eliminating all difficulty. Exceeding the budget causes learners to stop practicing and default to passive reading. Designers are prompted to consider how to adapt it for expert learners who may have a different tolerance for friction.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[deliberate practice]], [[interference]]

## LINK_INTENTS
```json
{
  "note_id": "friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning outcomes", "competence levels", "performance assessment"],
      "reason": "The Friction Budget is discussed in the context of designing for specific rungs of the Outcome Ladder to ensure effort is spent on transfer."
    },
    {
      "target_title": "deliberate practice",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["practice", "skill development", "focused effort"],
      "reason": "Exceeding the Friction Budget causes learners to stop engaging in deliberate practice, a core related concept."
    },
    {
      "target_title": "interference",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["performance under pressure", "cognitive interference", "stress"],
      "reason": "The source text introduces the Friction Budget while discussing the root problem of interference that hinders real-world performance."
    }
  ]
}