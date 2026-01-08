---
verified: true
verified_at: 2026-01-08T14:09:26.930Z
id: example-managerial-coaching-scenario
type: example
tags: [example, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Managerial Coaching Scenario

## Scenario
A manager is presented with a situation where a team member says: “I keep missing deadlines because other teams block me.” The learner must choose between two potential managerial actions and provide a one-sentence reason for their choice, as part of a [[7-Minute Microlearning Loop]].

## Context
The scenario is presented as a sample within a guide on designing effective [[Microlearning]]. It is used to illustrate how to create a short, constrained practice scenario that targets a specific rung on the [[Outcome Ladder]] (likely Rung C: perform or Rung D: transfer). The design aims to combat the problem of *interference*, where managers freeze under pressure or forget steps in real conversations.

## Key Insight
This example illustrates the core design principle of creating practice with realistic constraints and clear, binary choices to force a commitment, which is essential for [[Calibration Loop|calibration]] and [[Transfer (Learning)|transfer]]. It moves beyond simple recognition (Rung B) to performance under realistic pressure.

## Structure
- **Setup:** A manager is in a conversation with a team member who is struggling with missed deadlines due to inter-team blocks.
- **Tension:** The learner-manager must decide how to respond effectively in the moment.
- **Resolution:** The source text cuts off, but the implied structure is that the learner chooses between Action A (Ask for a concrete recent example) and another, unspecified tempting wrong action.
- **Outcome:** The exercise is designed to provide [[Two-Speed Feedback]] on the choice, helping the learner internalize a rule of thumb for similar future situations.

## Rewrite Opportunity
- **Core Pattern:** The pattern is a constrained, binary-choice scenario built around a common managerial friction point (e.g., blame-shifting, vague problems).
- **Transferable Elements:** This structure can be applied to any skill where performance under pressure is key. The scenario can be adapted by changing the problem statement (e.g., "My project is off track because of changing requirements") and the two action choices, while preserving the need for a concrete reason and subsequent feedback.

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "example-managerial-coaching-scenario",
  "link_intents": [
    {
      "anchor_text": "7-Minute Microlearning Loop",
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "tool",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "This is a named, structured design procedure central to the source text."
    },
    {
      "anchor_text": "Microlearning",
      "target_title": "Microlearning",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "This is the overarching domain concept for the entire chapter."
    },
    {
      "anchor_text": "Outcome Ladder",
      "target_title": "Outcome Ladder",
      "intent_type": "framework",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "This is a key framework for defining learning targets, referenced when designing the scenario."
    },
    {
      "anchor_text": "Calibration Loop",
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.85,
      "reason": "The scenario's design (choice + reason) is explicitly meant to fuel the calibration process."
    },
    {
      "anchor_text": "Transfer (Learning)",
      "target_title": "Transfer (Learning)",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.7,
      "reason": "Transfer is a critical rung on the Outcome Ladder and the ultimate goal of the exercise."
    },
    {
      "anchor_text": "Two-Speed Feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "technique",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "This is a named feedback method that would be applied after the learner makes a choice in the scenario."
    },
    {
      "anchor_text": "interference",
      "target_title": "Interference (Learning)",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "This is a core problem the scenario design aims to solve, defined in the source."
    }
  ]
}