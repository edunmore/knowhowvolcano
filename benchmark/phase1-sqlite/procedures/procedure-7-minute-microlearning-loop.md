---
verified: true
verified_at: 2026-01-08T18:58:51.609Z
id: procedure-7-minute-microlearning-loop
type: procedure
tags: [procedure, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["microlearning design", "instructional design loop", "scenario-based practice", "deliberate practice", "feedback layers"]
---
# 7-Minute Microlearning Loop

## When to use
Use this design procedure to create short, effective learning units for skills that can be observed, in order to combat learner interference under pressure. It is less effective when outcomes are invisible or when the environment blocks practice.

## Steps
1.  **Target a specific outcome**: Choose one level from the [[Outcome Ladder]] (e.g., Stage: Recognize or Stage: Perform).
2.  **Define success**: Write one observable pass condition that can be seen or measured.
3.  **Create a constrained scenario**: Design a short, realistic scenario that includes a constraint like time pressure or incomplete information.
4.  **Offer two choices**: Present the intended correct action and one tempting but incorrect alternative.
5.  **Elicit choice and rationale**: Ask the learner to choose an action *and* provide a one-sentence reason for their choice.
6.  **Provide layered feedback**: Give feedback in two parts: a fast, memorable rule of thumb, followed by a deeper explanation of why it works and its limits.
7.  **Schedule repetition**: Add a prompt for when and how to practice the skill again (e.g., tomorrow or in the next real case).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "procedure-7-minute-microlearning-loop",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer", "performance assessment"],
      "reason": "The first step of the procedure requires selecting a target level from this framework."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert explanation", "calibration"],
      "reason": "Step 6 of the loop explicitly implements this feedback structure for effective learning."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "deliberate practice", "instructional design"],
      "reason": "The procedure is designed to manage cognitive friction by focusing on one skill and avoiding extraneous content."
    }
  ]
}