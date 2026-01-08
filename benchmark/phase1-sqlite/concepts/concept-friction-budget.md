---
verified: true
verified_at: 2026-01-08T18:58:19.693Z
id: concept-friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learning effort", "mental capacity", "deliberate practice", "instructional design"]
---
# Friction Budget

## Definition
A **Friction Budget** is the maximum amount of mental effort or cognitive load a learner can expend on a learning unit before they disengage (quit) or resort to superficial strategies like guessing. It is a design constraint that emphasizes managing complexity to preserve learner capacity for deliberate practice.

## Key Components
The source text describes factors that consume the friction budget, though not as formal sub-levels. These can be abstracted as:
- **Cognitive Overload**: Caused by introducing too many new terms, concepts, or steps at once.
- **Interface Switching Cost**: The mental effort required to navigate between multiple screens or information sources.
- **Excessive Content**: Adding more examples or theory that raises friction without improving skill transfer.

## Application
When designing a learning unit, the Friction Budget must be managed. The goal is not to eliminate all difficulty but to strategically "spend friction where it buys transfer." Designers should minimize unnecessary complexity (e.g., extraneous content) to ensure the learner's mental effort is available for the core practice needed to achieve the target outcome, such as performing under constraints.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Two-Speed Feedback]], [[Calibration Loop]]

## LINK_INTENTS
```json
{
  "note_id": "concept-friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer"],
      "reason": "The Friction Budget is a constraint applied when designing for a specific rung (level) on the Outcome Ladder."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.7,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "explanation"],
      "reason": "Two-speed feedback is a design technique that provides efficient (low-friction) and deep feedback, relating to managing the learner's cognitive load."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["expert comparison", "decision commitment", "feedback"],
      "reason": "The Calibration Loop is a learning process that requires deliberate practice, which depends on the Friction Budget not being exceeded."
    }
  ]
}