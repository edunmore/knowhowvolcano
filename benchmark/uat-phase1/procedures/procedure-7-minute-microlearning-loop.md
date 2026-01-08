---
verified: true
verified_at: 2026-01-08T16:47:36.930Z
id: procedure-7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single [[Microlearning]] unit aimed at turning internal know-how into short, effective learning experiences, especially for skills that can be observed. It is intended to help learners overcome [[Interference Under Stress]] and achieve [[Transfer (Learning)]] rather than just recall or recognition.

## Steps
1.  **Choose one [[Outcome Ladder]] rung** as the target (A: remember, B: recognize, C: perform, or D: transfer).
2.  **Write one "observable pass condition"** (what you can see or measure).
3.  **Create one short scenario with a constraint** (e.g., time pressure, an annoyed colleague, missing data).
4.  **Offer two actions**: the intended action and a tempting wrong action.
5.  **Ask for a choice *and* a one-sentence reason**.
6.  **Give feedback in two layers**: first a short [[Rule of Thumb]], then a deeper explanation (see [[Two-Speed Feedback]]).
7.  **Add a "next repetition" prompt**: specify when and how to repeat (e.g., tomorrow, next meeting, or next real case).

## Failure modes
*   The skill's outcomes are invisible or the environment blocks practice (e.g., no permission to try, high risk, or strict scripts).
*   Exceeding the learner's [[Friction Budget]] by requiring too many new terms, steps, or screen switches, causing learners to default to superficial reading.
*   Targeting the wrong rung of the [[Outcome Ladder]] or mixing multiple skills, which adds content without improving [[Transfer (Learning)]].
*   Not specified in this source. Open questions: (1) How does the loop adapt for asynchronous vs. synchronous delivery? (2) What is the minimum viable tooling needed to implement it at scale?

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "procedure-7-minute-microlearning-loop",
  "link_intents": [
    {
      "anchor_text": "Microlearning",
      "target_title": "Microlearning",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "This is the core domain entity for which the loop is a design procedure."
    },
    {
      "anchor_text": "Interference Under Stress",
      "target_title": "Interference Under Stress",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "A key prerequisite concept the procedure is designed to counteract, explicitly referenced as a background idea."
    },
    {
      "anchor_text": "Transfer (Learning)",
      "target_title": "Transfer (Learning)",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "A core learning construct and the highest rung on the Outcome Ladder, central to the loop's purpose."
    },
    {
      "anchor_text": "Outcome Ladder",
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 1.0,
      "reason": "A named model that is a critical prerequisite for Step 1 of the procedure."
    },
    {
      "anchor_text": "Rule of Thumb",
      "target_title": "Rule of Thumb",
      "intent_type": "tool",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.85,
      "reason": "A key component of the Two-Speed Feedback required in Step 6."
    },
    {
      "anchor_text": "Two-Speed Feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 1.0,
      "reason": "A named feedback technique that is a required component of Step 6."
    },
    {
      "anchor_text": "Friction Budget",
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 1.0,
      "reason": "A named model that defines a key constraint and failure mode for the procedure."
    }
  ]
}