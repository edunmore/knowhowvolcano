---
verified: true
verified_at: 2026-01-08T19:12:18.696Z
id: 7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "instructional loop", "scenario-based practice", "deliberate practice", "adaptive feedback"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single microlearning unit aimed at turning internal know-how into a short, effective learning experience. It is best applied when the target skill can be observed and practiced, even roughly, and when the goal is to overcome "interference" where learners freeze or fail under real-world pressure.

## Steps
1.  **Target a specific outcome level**: Choose one level from the [[Outcome Ladder]] as the target (e.g., Level 1 (author's "Rung A") for recall, up to Level 4 (author's "Rung D") for transfer).
2.  **Define an observable pass condition**: Write one clear, measurable condition for success that you can observe.
3.  **Create a constrained scenario**: Develop one short scenario that includes a realistic constraint, such as time pressure, an annoyed colleague, or missing data.
4.  **Offer two action choices**: Present the intended correct action and one tempting, plausible wrong action.
5.  **Require choice and rationale**: Ask the learner to choose an action *and* provide a one-sentence reason for their choice.
6.  **Provide two-speed feedback**: Give immediate feedback in two layers: a fast, memorable rule of thumb for use in the moment, followed by a deeper explanation of why the rule works and its limits.
7.  **Prompt for spaced repetition**: Add a prompt for the "next repetition," specifying when and how to practice again (e.g., tomorrow, in the next meeting, or on the next real case).

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
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment", "skill transfer"],
      "reason": "The first step of the procedure explicitly requires selecting a target level from the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_keys": ["cognitive load", "mental effort", "learning unit design", "deliberate practice"],
      "reason": "The procedure is designed with an awareness of cognitive load, aiming to spend 'friction' deliberately to buy transfer, which is the core concern of the Friction Budget concept."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["instructional feedback", "rule of thumb", "expert calibration", "learning feedback"],
      "reason": "Step 6 of the procedure directly implements the Two-Speed Feedback method, providing both a fast and a slow layer of explanation."
    }
  ]
}