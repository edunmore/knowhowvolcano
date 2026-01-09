---
verified: true
verified_at: 2026-01-09T09:54:55.674Z
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
The Outcome Ladder is a framework for classifying learning objectives into four distinct levels of competence, from basic recall to the ability to apply a skill in novel, high-pressure situations. It helps designers specify the desired real-world performance and avoid mistaking lower-level understanding for true mastery.

## Key Components
The ladder consists of four stages, translating the author's metaphor into general terms:
-   Level 1 (author's "Rung A"): **Recall** – The learner can remember and state key terms or facts.
-   Level 2 (author's "Rung B"): **Recognize** – The learner can identify the correct application or option from given examples.
-   Level 3 (author's "Rung C"): **Perform** – The learner can execute the correct behavior in a structured, realistic practice scenario.
-   Level 4 (author's "Rung D"): **Transfer** – The learner can apply the skill later, in a different context, and under stress or pressure.

## Application
The ladder is used to define the target for a learning unit, such as within the [[7-Minute Microlearning Loop]]. A common design mistake is to assess only at Level 1 (Recall) and assume higher-level competence has been achieved. The framework emphasizes that true learning is evidenced by transfer (Level 4).

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
      "confidence": 0.85,
      "embedding_match_keys": ["microlearning", "instructional design", "practice loop"],
      "reason": "The Outcome Ladder's rungs are explicitly used as the target for Step 1 of this design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.75,
      "embedding_match_keys": ["cognitive load", "learning effort", "instructional design"],
      "reason": "Both concepts are part of the same instructional design toolbox, and friction should be allocated to achieve transfer, the highest rung on the ladder."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "explanation"],
      "reason": "Two-Speed Feedback is presented as the method for delivering feedback within learning loops designed using the Outcome Ladder framework."
    }
  ]
}