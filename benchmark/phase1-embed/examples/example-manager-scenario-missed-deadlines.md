---
verified: true
verified_at: 2026-01-08T18:44:45.584Z
id: example-manager-scenario-missed-deadlines
type: example
tags: [example, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["manager scenario", "performance assessment", "diagnostic skill", "action selection", "realistic constraint"]
---
# Manager Scenario: Missed Deadlines

## Definition
A realistic scenario designed to assess and practice a managerial skill, specifically the ability to diagnose a problem before offering a solution. The scenario presents a common workplace problem (e.g., a team member missing deadlines) and two plausible actions, one of which is a tempting but often ineffective immediate solution.

## Context & Use
This example scenario is used to illustrate the application of the [[7-Minute Microlearning Loop]], targeting performance (Stage: Perform, author's 'Rung C') or transfer (Stage: Transfer, author's 'Rung D') levels. It places the learner in a constrained situation requiring a choice, facilitating the [[Calibration Loop]] where they compare their decision to an expert's.

## Scenario Description
**Prompt:** You are a manager. A team member says: “I keep missing deadlines because other teams block me.” You have two actions:
- **Action A:** Ask for a concrete recent example and explore constraints before proposing a solution.
- **Action B:** Give advice immediately: “Just communicate earlier and set boundaries.”

**Analysis:** The scenario highlights a common error where new managers choose Action B because it feels helpful, but this often "skips the diagnostic step and can trigger defensiveness." Action A represents the intended, more effective behavior.

## Design Principles
The scenario embodies several design principles from the source:
1.  **Observable Skill:** It focuses on a skill that "can be observed (even roughly)."
2.  **Tempting Wrong Action:** It offers a "tempting wrong action" (Action B) to test understanding.
3.  **Realistic Constraint:** It implies a common interpersonal constraint (risk of defensiveness).
4.  **Basis for Feedback:** The choice sets up the opportunity for [[Two-Speed Feedback]].

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Calibration Loop]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "example-manager-scenario-missed-deadlines",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["microlearning", "instructional design", "scenario", "practice loop"],
      "reason": "This scenario is a concrete example of the type of unit produced by following the 7-Minute Microlearning Loop procedure."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["calibration", "expert comparison", "decision feedback"],
      "reason": "The scenario is designed to be used within a calibration loop, where the learner commits to a choice (A or B) before receiving expert feedback."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback", "rule of thumb", "explanation"],
      "reason": "The scenario's two actions provide the basis for delivering two-speed feedback, explaining why Action A is preferable."
    }
  ]
}