---
verified: true
verified_at: 2026-01-08T18:57:58.025Z
id: concept-outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["learning progression", "competence levels", "performance assessment", "skill transfer", "outcome taxonomy"]
---
# Outcome Ladder

## Definition
A framework for classifying learning outcomes into four distinct levels of competence, from simple recall to the ability to apply a skill in novel, stressful situations. It is used to ensure learning design targets the appropriate level of real-world performance.

## Key Components
The progression from lower to higher-order outcomes:
- Level 1 (author's "Rung A"): **Recall** - The learner can remember terms or facts.
- Level 2 (author's "Rung B"): **Recognition** - The learner can identify the correct option or principle from given examples.
- Level 3 (author's "Rung C"): **Performance** - The learner can execute the correct behavior in a controlled or realistic practice scenario.
- Level 4 (author's "Rung D"): **Transfer** - The learner can apply the skill later, in a different context, and under pressure or stress.

## Application
Used to define the target outcome for a [[7-Minute Microlearning Loop]]. A common mistake is designing assessments only for Level 1 (Recall) while aiming for performance or transfer. The ladder helps diagnose the gap between knowledge and real-world application.

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
      "reason": "The Outcome Ladder's rungs are explicitly used as the target in Step 1 of this design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "Both concepts are part of the same instructional design toolbox, where friction should be allocated to buy transfer, a high-level outcome on the ladder."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["feedback", "rule of thumb", "performance support"],
      "reason": "The fast layer of feedback is designed to support performance and transfer (higher rungs) by providing a memorable rule for use in live situations."
    }
  ]
}