---
verified: true
verified_at: 2026-01-08T18:42:41.658Z
id: concept-outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["learning progression", "competence levels", "skill transfer", "performance assessment", "outcome hierarchy"]
---
# Outcome Ladder

## Definition
A framework for categorizing learning outcomes into four distinct levels of competence, moving from basic knowledge recall to the ability to apply a skill in novel, stressful situations. It helps specify the target of a learning unit and avoid the common mistake of measuring only recall.

## Key Components
The model consists of four sequential levels:
- **Level 1: Remember (author's "Rung A")**: The learner can recall terms and definitions.
- **Level 2: Recognize (author's "Rung B")**: The learner can identify the correct application or option from examples.
- **Level 3: Perform (author's "Rung C")**: The learner can execute the target behavior in a realistic practice scenario.
- **Level 4: Transfer (author's "Rung D")**: The learner can apply the skill later, in a different context, and under stress.

## Application
Used during instructional design to define a clear, observable target for a learning unit. It emphasizes that true skill development requires targeting higher levels (Perform and Transfer) rather than settling for Recall or Recognition. It is a core component of the [[7-Minute Microlearning Loop]].

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
      "embedding_match_keys": ["microlearning", "instructional design", "learning loop"],
      "reason": "The Outcome Ladder is explicitly used as Step 1 in the defined design loop procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "learning effort", "instructional design"],
      "reason": "Both are core concepts in the same instructional design toolbox, with friction needing to be spent to buy transfer, the highest rung."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["feedback", "learning transfer", "rule of thumb"],
      "reason": "Feedback is a critical element for achieving higher rungs like Transfer, and both are parts of the same instructional model."
    }
  ]
}