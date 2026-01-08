---
id: procedure-7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "scenario-based learning", "deliberate practice", "feedback loop", "transfer of learning"]
---
# 7-Minute Microlearning Loop

## When to use
Use this procedure to design a single microlearning unit aimed at turning knowledge into observable performance, particularly for skills that can be practiced and observed. It is triggered when the goal is to move learners beyond recall to recognition, performance, or transfer, as defined by the [[Outcome Ladder]].

## Steps
1.  **Target a specific outcome level:** Choose one rung from the [[Outcome Ladder]] (Level 1: Recall, Level 2: Recognize, Level 3: Perform, or Level 4: Transfer) as the goal for the unit.
2.  **Define a pass condition:** Write one observable, measurable condition that indicates the learner has succeeded.
3.  **Create a constrained scenario:** Build one short, realistic scenario that includes a constraint (e.g., time pressure, an annoyed colleague, missing data).
4.  **Offer two action choices:** Present the learner with two actions: the intended correct action and a tempting but incorrect alternative.
5.  **Require choice and rationale:** Ask the learner to choose an action *and* provide a one-sentence reason for their choice.
6.  **Provide two-speed feedback:** Give feedback in two layers: first a short, memorable rule of thumb, then a deeper explanation of why the rule works and its limits.
7.  **Prompt spaced repetition:** Add a prompt for the "next repetition," specifying when and how the learner should practice again (e.g., tomorrow, in the next meeting, or in the next real case).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Two-Speed Feedback]], [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "procedure-7-minute-microlearning-loop",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment", "transfer"],
      "reason": "The first step of the procedure explicitly requires selecting a target rung from the Outcome Ladder."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback", "rule of thumb", "expert explanation", "calibration"],
      "reason": "Step 6 of the loop directly implements the Two-Speed Feedback method described in the source."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "deliberate practice", "learning design constraint"],
      "reason": "The procedure is designed to manage cognitive load and deliberate practice, which are central to the Friction Budget concept."
    }
  ]
}