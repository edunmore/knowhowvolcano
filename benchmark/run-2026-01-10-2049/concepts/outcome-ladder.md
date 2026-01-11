---
verified: true
verified_at: 2026-01-10T19:49:17.620Z
id: outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["learning progression", "competence levels", "skill transfer", "performance assessment", "outcome specification"]
---
# Outcome Ladder

## Definition
A framework for categorizing learning outcomes by the depth of skill or knowledge demonstrated, moving from basic recall to complex application in varied contexts. It helps designers specify what "success looks like in the real world."

## Key Components
The ladder consists of four progressive stages (abstracted from the author's "Rungs"):
- **Level 1 (author's "Rung A: remember")**: The learner can recall terms or facts.
- **Level 2 (author's "Rung B: recognize")**: The learner can identify the correct option or principle from given examples.
- **Level 3 (author's "Rung C: perform")**: The learner can execute the target behavior in a realistic practice scenario.
- **Level 4 (author's "Rung D: transfer")**: The learner can apply the skill later, in a different context, and under pressure or stress.

## Application
Used to define the target for a learning unit and to avoid the common mistake of assessing only lower levels (like recall) while performance remains unchanged. It is a core part of the [[7-Minute Microlearning Loop]], where the first step is to choose a target rung.

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
      "embedding_match_keys": ["microlearning", "instructional design", "practice loop"],
      "reason": "The Outcome Ladder is explicitly used as Step 1 in this design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "learning effort", "instructional design"],
      "reason": "Both concepts are part of the same instructional design toolbox for creating effective microlearning."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["feedback", "rule of thumb", "skill calibration"],
      "reason": "Feedback is tailored to support learning at different rungs of the ladder, especially for performance and transfer."
    }
  ]
}