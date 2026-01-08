---
verified: true
verified_at: 2026-01-08T18:23:23.093Z
id: concept-friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner engagement", "instructional design", "mental effort", "deliberate practice"]
---
# Friction Budget

## Definition
The Friction Budget is the maximum amount of mental effort a learner can expend on a learning unit before they disengage or resort to superficial strategies like guessing. It is a design constraint that emphasizes allocating cognitive load strategically to promote skill transfer, rather than simply minimizing difficulty.

## Key Components
The concept identifies factors that deplete the friction budget, grounded in the source text:
- **Excessive Novelty**: Introducing "too many new terms at once".
- **Procedural Complexity**: Requiring "too many steps".
- **Interface Burden**: Causing "too much switching between screens".

## Application
Learning designers should manage the friction budget by intentionally spending cognitive effort on activities that lead to transfer (e.g., practicing under constraints in the [[7-Minute Microlearning Loop]]). Exceeding the budget causes learners to "stop doing deliberate practice and default to superficial reading." The source text prompts designers to consider how to adapt this budget for expert learners who may become bored with low-challenge content.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[7-Minute Microlearning Loop]], [[interference under stress]]

## LINK_INTENTS
```json
{
  "note_id": "concept-friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "The Friction Budget is a design constraint for achieving target outcomes defined on the ladder, particularly higher-level transfer."
    },
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "instructional design", "practice loop"],
      "reason": "The loop is a specific design procedure where managing the Friction Budget is a critical consideration for its success."
    },
    {
      "target_title": "interference under stress",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["performance degradation", "cognitive load", "stress"],
      "reason": "The source text lists 'interference under stress' as a related background idea that explains why managing friction is crucial for transfer to real-world, high-pressure situations."
    }
  ]
}