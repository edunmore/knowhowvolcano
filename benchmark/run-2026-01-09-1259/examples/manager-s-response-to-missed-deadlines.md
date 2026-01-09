---
verified: true
verified_at: 2026-01-09T12:00:53.950Z
id: manager-s-response-to-missed-deadlines
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["managerial feedback", "diagnostic questioning", "behavioral scenario", "decision calibration", "performance under pressure"]
---
# Manager's Response to Missed Deadlines

## Scenario Context
A manager must respond to a team member who says, "I keep missing deadlines because other teams block me." This scenario is presented within a [[7-Minute Microlearning Loop]] to teach a specific managerial skill.

## Presented Choices
The example provides two distinct managerial actions for the learner to evaluate:
*   **Action A (Intended):** "Ask for a concrete recent example and explore constraints before proposing a solution."
*   **Action B (Tempting Wrong Action):** "Give advice immediately: 'Just communicate earlier and set boundaries.'"

## Learning Objective
This example is designed to help learners recognize the importance of a diagnostic step in managerial conversations. It illustrates a common error where the desire to be helpful (choosing Action B) leads to skipping diagnosis, which can trigger defensiveness and fail to address the root cause.

## Application in Design
This scenario serves as a concrete application of the [[Outcome Ladder]], targeting Stage: Recognize (author's 'Rung B') or Stage: Perform (author's 'Rung C'). It forces a learner to commit to a choice and a reason, enabling a [[Calibration Loop]] by comparing their decision to an expert model.

```json
{
  "note_id": "manager-s-response-to-missed-deadlines",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning design", "instructional loop", "scenario-based practice"],
      "reason": "This example is explicitly structured as a sample scenario within the described 7-step design loop."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance stages"],
      "reason": "The scenario is an example of designing practice to target specific rungs (stages) of the Outcome Ladder."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["expert comparison", "decision feedback", "performance calibration"],
      "reason": "The example's purpose is to allow learners to calibrate their judgment by committing to a choice before seeing feedback."
    }
  ]
}