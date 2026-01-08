---
id: concept-calibration-loop
type: concept
tags: [concept, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Calibration Loop

## Definition
A **Calibration Loop** is a learning process where a learner improves their judgment by comparing their own decision to an expert's choice and understanding the difference. This process is most effective when the learner commits to a decision before seeing the answer and when the feedback highlights a specific, hidden variable that influenced the expert's reasoning.

## Operationalization
Calibration is observed in a learning unit when a learner is presented with a scenario, makes a choice, provides a reason, and then receives feedback that compares their choice to an expert's. The feedback must name a specific hidden variable (e.g., `[[Risk]]`, `[[Trust]]`, `[[Time]]`, `[[Power]]`, or `[[Uncertainty]]`) that explains the discrepancy. This is a core component of the `[[7-Minute Microlearning Loop]]`, particularly in the steps involving choice, reason-giving, and receiving `[[Two-Speed Feedback]]`.

## Boundary conditions
Not specified in this source. Open questions: (1) Does calibration require a live expert or can a model answer suffice? (2) What are the limits of calibration when the skill cannot be easily observed or practiced?

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "concept-calibration-loop",
  "link_intents": [
    {
      "anchor_text": "Risk",
      "target_title": "Risk",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.2,
      "reason": "Named as a hidden variable in feedback; likely a common concept needing definition elsewhere."
    },
    {
      "anchor_text": "Trust",
      "target_title": "Trust",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.2,
      "reason": "Named as a hidden variable in feedback; likely a common concept needing definition elsewhere."
    },
    {
      "anchor_text": "Time",
      "target_title": "Time",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.2,
      "reason": "Named as a hidden variable in feedback; likely a common concept needing definition elsewhere."
    },
    {
      "anchor_text": "Power",
      "target_title": "Power",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.2,
      "reason": "Named as a hidden variable in feedback; likely a common concept needing definition elsewhere."
    },
    {
      "anchor_text": "Uncertainty",
      "target_title": "Uncertainty",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.2,
      "reason": "Named as a hidden variable in feedback; likely a common concept needing definition elsewhere."
    },
    {
      "anchor_text": "7-Minute Microlearning Loop",
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "The source details this loop's steps, which operationalize calibration."
    },
    {
      "anchor_text": "Two-Speed Feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.6,
      "reason": "The source defines this as the feedback structure used within the learning loop that enables calibration."
    }
  ]
}