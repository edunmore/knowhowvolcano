---
verified: true
verified_at: 2026-01-08T19:13:27.514Z
id: managerial-scenario-missing-deadlines
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["managerial scenario", "decision-making under constraints", "diagnostic questioning", "transfer task", "performance assessment"]
---
# Managerial Scenario - Missing Deadlines

## Example
A learner is presented with a realistic scenario for practice: "You are a manager. A team member says: 'I keep missing deadlines because other teams block me.'" The learner must choose between two actions: Action A (ask for a concrete recent example and explore constraints) or Action B (give advice immediately). This scenario is designed to build skills at Level 3: Perform (author's "Rung C") by requiring a choice under realistic constraints.

## Design Context
This example is structured using the [[7-Minute Microlearning Loop]]. It targets a specific performance outcome, presents a tempting wrong action, and requires a commitment to a choice and a reason, facilitating a [[Calibration Loop]] where the learner compares their decision to an expert one. The wrong action (B) is tempting because "it feels helpful" but often skips diagnostic steps.

## Application Notes
This type of scenario works best "when the skill can be observed (even roughly)." It can fail when outcomes are invisible or the environment blocks practice (e.g., no permission to try, high risk).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Calibration Loop]], [[Outcome Ladder]]

```json
{
  "note_id": "managerial-scenario-missing-deadlines",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning loop", "scenario design", "performance practice"],
      "reason": "The scenario is explicitly presented as a sample built using the steps of the 7-Minute Microlearning Loop."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["calibration", "expert comparison", "decision feedback"],
      "reason": "The scenario's requirement to choose an action facilitates the calibration process described in the same source chunk."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["performance levels", "skill transfer", "learning outcome"],
      "reason": "The scenario is designed to target a specific rung (Perform/Rung C) on the Outcome Ladder framework introduced earlier."
    }
  ]
}