---
verified: true
verified_at: 2026-01-10T19:49:39.217Z
id: 7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "learning loop", "deliberate practice", "scenario-based learning", "feedback design"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single, focused learning unit when the goal is to develop a specific, observable skill and avoid learners defaulting to superficial reading. It works best "when the skill can be observed (even roughly)" and can fail for invisible outcomes or in environments that block practice.

## Steps
1.  **Target an Outcome Level**: Choose one rung from the [[outcome-ladder]] (e.g., Stage: Recognize (author's "Rung B") or Stage: Perform (author's "Rung C")) as the target for the unit.
2.  **Define a Pass Condition**: Write one observable, measurable condition for passing the unit.
3.  **Create a Constrained Scenario**: Create one short, realistic scenario that includes a constraint like time pressure, an annoyed colleague, or missing data.
4.  **Offer Two Action Choices**: Present the learner with two possible actions: the intended correct action and a tempting, plausible wrong action.
5.  **Request Choice and Rationale**: Ask the learner to choose an action *and* provide a one-sentence reason for their choice.
6.  **Provide Two-Speed Feedback**: Give feedback in two layers: a fast, memorable rule of thumb for use in real-time, followed by a deeper explanation of why the rule works and when it might fail.
7.  **Prompt Spaced Repetition**: Add a prompt for the "next repetition," specifying when and how to practice again (e.g., tomorrow, in the next meeting, on the next real case).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[outcome-ladder]], [[friction-budget]], [[two-speed-feedback]]

## LINK_INTENTS
```json
{
  "note_id": "7-minute-microlearning-loop",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "The first step of the procedure is to select a target level from this model."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "learner effort", "deliberate practice"],
      "reason": "The procedure is designed to manage cognitive load and keep effort within the learner's friction budget."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert explanation"],
      "reason": "Step 6 of the loop explicitly implements the two-speed feedback method."
    }
  ]
}