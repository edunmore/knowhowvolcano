---
verified: true
verified_at: 2026-01-09T12:00:03.273Z
id: 7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "instructional loop", "deliberate practice", "scenario-based learning", "two-speed feedback"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single learning unit aimed at turning internal know-how into actionable skills, particularly for observable skills where real-world failure is caused by interference (e.g., freezing under pressure).

## Steps
1.  **Target an outcome level**: Choose one target level from the [[Outcome Ladder]] (e.g., Stage: Perform (author's 'Rung C')).
2.  **Define a pass condition**: Write one observable, measurable condition for passing the unit.
3.  **Create a constrained scenario**: Design one short scenario featuring a realistic constraint like time pressure or an annoyed colleague.
4.  **Offer two action choices**: Present the intended correct action and one tempting, plausible wrong action.
5.  **Elicit choice and rationale**: Ask the learner to choose an action *and* provide a one-sentence reason for their choice.
6.  **Provide two-speed feedback**: Give immediate feedback with a short, memorable rule of thumb, followed by a deeper explanation of why the rule works.
7.  **Schedule repetition**: Add a prompt for when and how to practice the skill again (e.g., "tomorrow, next meeting, or next real case").

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "7-minute-microlearning-loop",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer", "performance assessment"],
      "reason": "The first step of the loop requires selecting a target level from the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning unit design", "deliberate practice"],
      "reason": "The loop is designed with an awareness of the Friction Budget to prevent learners from quitting or guessing."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["immediate feedback", "rule of thumb", "expert explanation", "calibration"],
      "reason": "Step 6 of the loop explicitly implements the Two-Speed Feedback procedure."
    }
  ]
}