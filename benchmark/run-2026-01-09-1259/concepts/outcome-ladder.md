---
verified: true
verified_at: 2026-01-09T11:59:40.449Z
id: outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["learning progression", "competence levels", "skill transfer", "performance assessment", "outcome taxonomy"]
---
# Outcome Ladder

## Definition
A framework for categorizing learning outcomes into four distinct levels of competence, from basic recall to the ability to apply a skill in novel, high-pressure situations.

## Key Components
The ladder comprises four levels:
- Level 1 (author's "Rung A: remember"): The learner can recall terms or facts.
- Level 2 (author's "Rung B: recognize"): The learner can identify the correct option or principle from given examples.
- Level 3 (author's "Rung C: perform"): The learner can execute the target behavior in a realistic, structured scenario.
- Level 4 (author's "Rung D: transfer"): The learner can apply the skill later, in a different context, and under stress or pressure.

## Application
The ladder is used to define the target level of competence for a learning unit and to ensure assessment matches the desired real-world outcome. A common design error is testing only at Level 1 (recall) while expecting performance at Level 3 or 4. It is a core component of the [[7-Minute Microlearning Loop]].

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Friction Budget]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "outcome-ladder",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "instructional design", "learning loop"],
      "reason": "The Outcome Ladder is explicitly used as Step 1 in this design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_keys": ["cognitive load", "learning effort", "deliberate practice"],
      "reason": "Both concepts are part of the same instructional design toolbox, and friction should be strategically spent to achieve higher ladder levels like transfer."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback", "rule of thumb", "skill calibration"],
      "reason": "Feedback is tailored to support learning at different rungs of the ladder, especially for performance and transfer."
    }
  ]
}