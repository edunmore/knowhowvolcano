---
verified: true
verified_at: 2026-01-10T19:50:24.539Z
id: manager-scenario-missed-deadlines
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["manager scenario", "performance assessment", "behavioral choice", "diagnostic action", "training vignette"]
---
# Manager Scenario: Missed Deadlines

## Scenario Description
A sample training vignette designed to assess a manager's ability to choose between a diagnostic and a prescriptive action when a team member reports a performance problem. The learner must select an action and provide a rationale, simulating a realistic constraint.

## Context & Setup
The scenario presents a manager whose team member says: “I keep missing deadlines because other teams block me.” The learner is then presented with two possible actions.

## Available Choices
1.  **Action A (Diagnostic):** "Ask for a concrete recent example and explore constraints before proposing a solution."
2.  **Action B (Prescriptive):** "Give advice immediately: 'Just communicate earlier and set boundaries.'"

## Intended Learning Outcome
This scenario targets Stage: Perform (author's "Rung C") or Stage: Transfer (author's "Rung D"). The observable pass condition is the learner choosing Action A and providing a reason that acknowledges the need for diagnosis before advice. The tempting wrong action (Action B) is common because it "feels helpful" but often skips diagnosis and can trigger defensiveness.

## Application in Design
This example illustrates the application of the [[7-Minute Microlearning Loop]], specifically creating a short scenario with a constraint (the team member's complaint). It is intended for use with [[Two-Speed Feedback]], where the fast feedback layer would provide a rule of thumb for diagnostic questioning, and the slow layer would explain the risks of premature advice.

```json
{
  "note_id": "manager-scenario-missed-deadlines",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "instructional design", "scenario creation", "practice loop"],
      "reason": "This scenario is a direct example of a unit created using the steps of the 7-Minute Microlearning Loop."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert explanation", "calibration"],
      "reason": "The scenario is designed to be paired with two-speed feedback to correct the common error and build transferable skill."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment", "skill transfer"],
      "reason": "The scenario's target outcome is defined using the rungs of the Outcome Ladder (Perform/Transfer)."
    }
  ]
}