---
id: concept-calibration-loop
type: concept
tags: [concept, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Calibration Loop

## Definition
A **Calibration Loop** is a learning process where a learner improves their judgment by comparing their own choice to an expert choice and understanding the gap between them. This comparison is most effective when the learner commits to a decision before seeing the answer and the feedback highlights the underlying variable (e.g., risk, trust, time) that explains the difference.

## Operationalization
A Calibration Loop can be observed or implemented by following a specific sequence: (1) Present a learner with a scenario and require them to commit to a specific choice or action before revealing the correct answer. (2) Provide feedback that explicitly names the **hidden variable** (e.g., "risk," "trust," "time," "power," or "uncertainty") that distinguishes the learner's choice from the expert's. The speed of calibration improvement can be measured by the learner's increasing accuracy in subsequent, similar decision-making scenarios.

## Boundary Conditions
Not specified in this source. Open questions: (1) Does the Calibration Loop apply equally to all rungs of the [[Outcome Ladder]], or is it primarily for higher-order performance? (2) What are the limits of its effectiveness if the "expert choice" is not clearly defined or is contested?

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "concept-calibration-loop",
  "link_intents": [
    {
      "anchor_text": "Outcome Ladder",
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "It is a core, named model in the source text used to define learning targets."
    },
    {
      "anchor_text": "hidden variable",
      "target_title": "Hidden Variable",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "It is a key construct for effective feedback within the Calibration Loop."
    },
    {
      "anchor_text": "feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "The source describes a specific feedback structure that could be integrated with the calibration process."
    },
    {
      "anchor_text": "scenario",
      "target_title": "Scenario-Based Learning",
      "intent_type": "technique",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "Scenarios are the context in which calibration choices are made, as shown in the sample."
    },
    {
      "anchor_text": "transfer",
      "target_title": "Transfer",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.75,
      "reason": "Transfer is a high-level learning outcome (Rung D) that calibration likely supports."
    },
    {
      "anchor_text": "Friction Budget",
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "It is a core, named model in the source text that governs learning design efficiency."
    },
    {
      "anchor_text": "7-Minute Microlearning Loop",
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.85,
      "reason": "It is the primary design procedure in the source, within which calibration might occur."
    }
  ]
}