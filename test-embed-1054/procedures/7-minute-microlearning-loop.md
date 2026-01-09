---
verified: true
verified_at: 2026-01-09T09:55:19.935Z
id: 7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "scenario-based training", "deliberate practice", "feedback loop", "instructional design"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single microlearning unit when the goal is to turn internal know-how into training that helps people perform in real situations, especially to overcome interference under pressure. It is best for skills that can be observed, and may fail for invisible outcomes or when practice is blocked by the environment.

## Steps
1.  **Target an outcome level**: Choose one target level from the [[Outcome Ladder]] (e.g., Level 3: Perform).
2.  **Define a pass condition**: Write one observable, measurable condition for passing.
3.  **Create a constrained scenario**: Craft a short scenario with a realistic constraint (e.g., time pressure, an annoyed colleague).
4.  **Offer two actions**: Present the intended correct action and one tempting, plausible wrong action.
5.  **Require choice and rationale**: Ask the learner to choose an action *and* provide a one-sentence reason.
6.  **Provide two-speed feedback**: Give immediate feedback with a short, memorable rule of thumb, followed by a deeper explanation of why it works and when it fails.
7.  **Schedule repetition**: Add a prompt for when and how to repeat the practice (e.g., tomorrow, in the next meeting).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Two-Speed Feedback]], [[Friction Budget]]

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
      "reason": "The first step of the procedure is to select a target level from the Outcome Ladder."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback mechanism", "rule of thumb", "expert explanation", "deliberate practice"],
      "reason": "Step 6 of the procedure explicitly implements the Two-Speed Feedback method."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "instructional design", "learner engagement"],
      "reason": "The procedure is designed with the Friction Budget in mind, aiming to spend friction where it buys transfer."
    }
  ]
}