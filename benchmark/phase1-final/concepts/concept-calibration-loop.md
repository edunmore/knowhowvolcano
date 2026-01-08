---
verified: true
verified_at: 2026-01-08T18:24:49.392Z
id: concept-calibration-loop
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["calibration", "expert comparison", "decision feedback", "skill adjustment", "performance gap"]
---
# Calibration Loop

## Definition
A Calibration Loop is a learning process where a learner improves their judgment by comparing their own decision to an expert's decision and understanding the difference between them. This comparison is most effective when the learner commits to a choice before seeing the correct answer.

## Key Components
1. **Learner Commitment**: The learner must make a concrete choice before being shown the expert's answer.
2. **Expert Comparison**: The learner's choice is explicitly compared to a model or expert choice.
3. **Feedback on Critical Factors**: The feedback identifies the hidden variable (e.g., risk, trust, time, power, or uncertainty) that explains the discrepancy between the learner's and the expert's decisions.

## Application
This concept is applied within a [[7-Minute Microlearning Loop]] to design practice scenarios. It is used to accelerate the improvement of a learner's skill calibration, particularly for observable skills. It is part of a broader learning design that includes an [[Outcome Ladder]] and considers a [[Friction Budget]].

## LINK_INTENTS
```json
{
  "note_id": "concept-calibration-loop",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["microlearning", "instructional loop", "scenario design"],
      "reason": "The Calibration Loop is a core component applied within the steps of the microlearning design procedure."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance stages"],
      "reason": "The Calibration Loop is a mechanism for achieving higher rungs (levels) on the Outcome Ladder, particularly performance and transfer."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning efficiency"],
      "reason": "Effective calibration loops must be designed within the constraints of the learner's available mental effort to avoid superficial engagement."
    }
  ]
}