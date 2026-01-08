---
verified: true
verified_at: 2026-01-08T18:25:12.955Z
id: example-manager-s-deadline-scenario
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["managerial coaching", "scenario-based training", "diagnostic questioning", "skill transfer", "performance under pressure"]
---
# Manager's Deadline Scenario

## Example Description
A concrete scenario used to practice a managerial skill, where a team member reports missing deadlines due to external blockers. The learner must choose between two actions: one diagnostic and one that immediately gives advice.

## Context & Setup
The scenario presents a realistic constraint: a manager facing a direct report's problem. The learner is given two distinct actions to choose from, representing a common novice mistake versus an expert approach. The scenario is designed for the learner to "commit to a decision before seeing the answer."

## Key Elements
- **Observable Problem**: "A team member says: 'I keep missing deadlines because other teams block me.'"
- **Action A (Intended)**: "Ask for a concrete recent example and explore constraints before proposing a solution."
- **Action B (Tempting Wrong Action)**: "Give advice immediately: 'Just communicate earlier and set boundaries.'"
- **Hidden Variable**: The scenario implicitly involves variables like risk, trust, or power, which expert feedback would name.

## Application in Learning Design
This example illustrates how to apply the [[7-Minute Microlearning Loop]]:
1.  It targets a higher performance rung (author's "Rung C" or "Rung D").
2.  It provides two clear actions for the learner to choose between.
3.  It sets up a subsequent [[Calibration Loop]] where the learner compares their choice to an expert's.

## Derived Insights
The example demonstrates that "many new managers choose B because it feels helpful," highlighting the gap between recognition and performance. It shows that effective skill transfer requires practice with realistic constraints, not just theoretical understanding.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Calibration Loop]], [[Outcome Ladder]]

## LINK_INTENTS
```json
{
  "note_id": "example-manager-s-deadline-scenario",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning design", "learning loop", "scenario constraint"],
      "reason": "This scenario is a direct application of the steps in the 7-Minute Microlearning Loop procedure."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["expert comparison", "decision commitment", "feedback"],
      "reason": "The scenario is designed to be used within a calibration loop where the learner commits to a choice before receiving feedback."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["performance levels", "skill transfer", "learning outcomes"],
      "reason": "The scenario is an example of targeting performance ('Rung C') or transfer ('Rung D') on the Outcome Ladder."
    }
  ]
}