---
id: concept-calibration-loop
type: concept
tags: [concept, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Calibration Loop

## Definition
A [[Calibration Loop]] is a learning process where a learner improves their judgment by comparing their own choice to an expert choice and understanding the difference. It is a core mechanism for bridging the gap between [[Recognition vs Performance]].

## Operationalization
Calibration is operationalized through a specific learning sequence. First, the learner must **commit to a decision before seeing the answer**. Then, they receive feedback that explicitly **names the hidden variable** (e.g., risk, trust, time, power, or uncertainty) that explains the difference between their choice and the expert's choice. This process is embedded within a [[7-Minute Microlearning Loop]] that includes a scenario, a choice between actions, and [[Two-Speed Feedback]].

## Boundary conditions
The source text suggests the calibration process works best when the skill being learned is **observable (even roughly)**. It can fail when outcomes are invisible or when the **environment blocks practice** (e.g., no permission to try, high risk, or strict scripts). Not specified in this source. Open questions: (1) How does calibration speed vary with learner expertise? (2) What are the specific metrics for measuring improved calibration over time?

## Links
Derived from: [[src_38e4b47a40f0]]
Related: [[7-Minute Microlearning Loop]], [[Two-Speed Feedback]], [[Friction Budget]], [[Recognition vs Performance]], [[Outcome Ladder]]

## LINK_INTENTS
```json
{
  "note_id": "concept-calibration-loop",
  "link_intents": [
    {
      "anchor_text": "Calibration Loop",
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 1.0,
      "reason": "This is the primary concept being defined in the note."
    },
    {
      "anchor_text": "Recognition vs Performance",
      "target_title": "Recognition vs Performance",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "The source text contrasts recognition with performance, which calibration aims to address."
    },
    {
      "anchor_text": "commit to a decision",
      "target_title": "Commitment Before Feedback",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "A key operational step for calibration, but not a named model in the source."
    },
    {
      "anchor_text": "hidden variable",
      "target_title": "Hidden Variable",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.5,
      "reason": "A key element of effective feedback in the calibration process."
    },
    {
      "anchor_text": "7-Minute Microlearning Loop",
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "The primary procedural framework within which calibration occurs."
    },
    {
      "anchor_text": "Two-Speed Feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "The feedback structure that supports the calibration process."
    },
    {
      "anchor_text": "Friction Budget",
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "A related concept governing the design of learning units that include calibration."
    },
    {
      "anchor_text": "Outcome Ladder",
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "The target for a learning unit, which provides context for the calibration exercise."
    },
    {
      "anchor_text": "observable (even roughly)",
      "target_title": "Observable Skill",
      "intent_type": "glossary",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A boundary condition for where the calibration approach is applicable."
    },
    {
      "anchor_text": "environment blocks practice",
      "target_title": "Practice-Blocking Environment",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A stated failure condition for the calibration method."
    }
  ]
}