---
verified: true
verified_at: 2026-01-08T18:51:31.560Z
id: concept-outcome-ladder
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
The Outcome Ladder is a model for categorizing learning outcomes based on the depth of skill application, ranging from basic recall to complex transfer. It is used to clarify what "success looks like in the real world" and to ensure learning design targets the appropriate level of performance.

## Key Components
The model outlines four ascending levels of competence:
- **Level 1 (author's "Rung A")**: Remember - The learner can recall terms or facts.
- **Level 2 (author's "Rung B")**: Recognize - The learner can pick the correct option from given examples.
- **Level 3 (author's "Rung C")**: Perform - The learner can execute the behavior in a realistic practice scenario.
- **Level 4 (author's "Rung D")**: Transfer - The learner can apply the skill later, in a different context, and under stress or pressure.

## Application
The ladder is used as a design tool to select a target level for a learning unit and to write an observable pass condition. A common mistake is to only assess at Level 1 (Recall) while aiming for higher-level performance, leading to a false sense of progress.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Friction Budget]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "concept-outcome-ladder",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "instructional design", "practice loop"],
      "reason": "The Outcome Ladder's rungs are used as the target in Step 1 of this design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "learning effort", "mental effort"],
      "reason": "The concept is discussed in the same toolbox for designing effective microlearning, with friction needing to be spent to 'buy transfer' (Rung D)."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert calibration"],
      "reason": "This feedback method supports learning at higher rungs (Perform, Transfer) by providing actionable and explanatory layers."
    }
  ]
}