---
verified: true
verified_at: 2026-01-08T18:53:24.166Z
id: example-manager-scenario-missing-deadlines
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["manager training scenario", "performance assessment", "microlearning design", "decision-making practice", "feedback calibration"]
---
# Manager Scenario: Missing Deadlines

## Example Description
This is a sample scenario for training managers, illustrating a common interpersonal challenge where a team member blames external factors for missing deadlines. It is designed for [[The 7-Minute Microlearning Loop]].

## Scenario Content
You are a manager. A team member says: “I keep missing deadlines because other teams block me.” You have two actions:

Action A: Ask for a concrete recent example and explore constraints before proposing a solution.
Action B: Give advice immediately: “Just communicate earlier and set boundaries.”

The scenario notes that many new managers choose the tempting but often ineffective Action B, which skips diagnostic steps and can cause defensiveness, whereas Action A represents the intended expert behavior.

## Educational Purpose
This scenario serves as a practice element within a microlearning unit. It forces a choice between two concrete actions, facilitating [[The Calibration Loop]] where learners compare their decision to an expert one. It targets performance (Stage: Perform (author's 'Rung C')) or transfer (Stage: Transfer (author's 'Rung D')) by simulating a realistic constraint.

## Application Context
The toolbox containing this scenario works best for observable skills. It can fail when outcomes are invisible or the environment blocks practice (e.g., no permission to try, high risk).

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[The 7-Minute Microlearning Loop]], [[The Calibration Loop]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "example-manager-scenario-missing-deadlines",
  "link_intents": [
    {
      "target_title": "The 7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning design", "instructional loop", "practice scenario"],
      "reason": "This scenario is explicitly presented as a sample to be used within the 7-minute microlearning loop procedure."
    },
    {
      "target_title": "The Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["expert comparison", "decision feedback", "performance calibration"],
      "reason": "The scenario's design of forcing a choice between two actions directly enables the calibration process described in the source text."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["layered feedback", "rule of thumb", "explanation"],
      "reason": "The scenario is a typical use case for applying two-speed feedback, where a learner's choice would be followed by fast and slow feedback layers."
    }
  ]
}