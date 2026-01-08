---
verified: true
verified_at: 2026-01-08T18:42:50.663Z
id: concept-friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner effort", "learning design", "instructional friction", "mental capacity"]
---
# Friction Budget

## Definition
The Friction Budget is a design concept representing the maximum amount of mental effort a learner can expend on a learning unit before they disengage or resort to superficial strategies like guessing. It is a finite resource that is consumed by factors like complexity, volume of new information, and interface demands.

## Key Components
The source text identifies factors that increase friction and consume the budget:
- **Volume of New Information**: Introducing "too many new terms at once."
- **Procedural Complexity**: Requiring "too many steps."
- **Interface/Context Switching**: Demanding "too much switching between screens."
Exceeding the budget causes learners to "stop doing deliberate practice and default to superficial reading."

## Application
The concept is applied in [[microlearning]] design to strategically allocate cognitive effort. The goal is not to eliminate all difficulty but to "spend friction where it buys transfer"—that is, to invest the learner's limited mental capacity in activities that promote application and adaptation of skills to new contexts. Designers must balance content richness against this budget to maintain engagement and effective practice.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[microlearning]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "concept-friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance stages"],
      "reason": "The Friction Budget is discussed in the context of designing for specific rungs of the Outcome Ladder, as spending friction should aim for transfer."
    },
    {
      "target_title": "microlearning",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["short learning units", "instructional design", "learning loop"],
      "reason": "The concept is a core part of the toolbox for designing effective microlearning units, as described in the '7-Minute Microlearning Loop'."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["feedback layers", "instructional feedback", "rule of thumb"],
      "reason": "Two-Speed Feedback is presented as a method to deliver efficient feedback within the constraints of the learner's Friction Budget."
    }
  ]
}