---
verified: true
verified_at: 2026-01-09T12:00:37.805Z
id: calibration-loop
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["calibration", "deliberate practice", "feedback loop", "expert comparison", "decision making"]
---
# Calibration Loop

## Definition
A Calibration Loop is a learning process where a learner improves their judgment by comparing their own decision to an expert's decision and understanding the gap between them. This process is most effective when the learner commits to a choice before seeing the correct answer.

## Key Components
1.  **Learner Commitment (Author's "commit to a decision"):** The learner must make and commit to a specific choice or action before receiving feedback.
2.  **Expert Comparison:** The learner's choice is explicitly compared to an expert's choice or a model answer.
3.  **Feedback on Hidden Variables (Author's "names the hidden variable"):** The feedback explains the difference by identifying the underlying critical factor (e.g., risk, trust, time, power, or uncertainty) that the learner may have missed.

## Application
This concept is applied in learning design, particularly within microlearning scenarios, to accelerate the development of accurate judgment and decision-making skills. It is a core mechanism within [[Two-Speed Feedback]] systems, where the "slow layer" of feedback facilitates this calibration by explaining the reasoning behind the expert choice.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Two-Speed Feedback]], [[Outcome Ladder]], [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "calibration-loop",
  "link_intents": [
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["feedback", "deliberate practice", "rule of thumb"],
      "reason": "The Calibration Loop is explicitly described as the process enhanced by the 'slow layer' of Two-Speed Feedback, which explains the expert reasoning."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["performance assessment", "skill transfer", "competence levels"],
      "reason": "The Calibration Loop is a method for achieving higher rungs (Levels) of the Outcome Ladder, such as 'perform' and 'transfer', by improving decision-making under constraints."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "Effective calibration loops must be designed within a Friction Budget to ensure learners engage in deliberate comparison rather than superficial reading."
    }
  ]
}