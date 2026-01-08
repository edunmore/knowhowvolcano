---
id: example-manager-scenario-blocked-team-member
type: example
tags: [example, extracted]
derived_from: ["src_38e4b47a40f0"]
---
# Manager Scenario - Blocked Team Member

## Scenario
A manager is presented with a situation where a [[Team Member]] says, “I keep missing deadlines because other teams block me.” The manager has two possible [[Action|Actions]]: (A) ask for a concrete recent example and explore constraints before proposing a solution, or (B) give advice immediately: “Just communicate earlier and set boundaries.”

## Context
The scenario is presented as a sample used for training or [[Calibration]]. It is designed to test a learner's ability to apply a [[Diagnostic Step]] under the common managerial pressure to provide quick, seemingly helpful solutions. The source notes that "many new managers choose B because it feels helpful."

## Key Insight
The example illustrates the common mistake of skipping the [[Diagnostic Step]] in favor of immediate advice, which can trigger defensiveness and fail to address the root cause. It serves as a practical application for practicing [[Two-Speed Feedback]] and [[Calibration Loop|Calibration]].

## Structure
- **Setup:** A team member reports a recurring problem (missed deadlines due to being blocked by other teams).
- **Tension:** The manager must choose between a diagnostic approach (Action A) and a prescriptive, quick-fix approach (Action B).
- **Resolution:** The source implies Action A is the intended, expert choice, while Action B is the tempting wrong action.
- **Outcome:** Choosing B often skips diagnosis and can cause defensiveness, demonstrating the gap between recognition of a good model and actual [[Performance Under Stress]].

## Rewrite Opportunity
Not specified in this source. Open questions: (1) How could this scenario be adapted to test different managerial skills, like [[Conflict Resolution]] or [[Stakeholder Management]]? (2) What other "tempting wrong actions" could be constructed for similar diagnostic challenges?

## Links
Derived from: [[src_38e4b47a40f0]]

## LINK_INTENTS
```json
{
  "note_id": "example-manager-scenario-blocked-team-member",
  "link_intents": [
    {
      "anchor_text": "Team Member",
      "target_title": "Team Member",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "A core role in the scenario; a foundational management concept."
    },
    {
      "anchor_text": "Action|Actions",
      "target_title": "Action",
      "intent_type": "concept",
      "stub_policy": "create_empty",
      "confidence": 0.4,
      "reason": "Central to the structure of the example where a choice must be made."
    },
    {
      "anchor_text": "Calibration",
      "target_title": "Calibration",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Explicitly named in the source text as a key learning mechanism related to the scenario."
    },
    {
      "anchor_text": "Diagnostic Step",
      "target_title": "Diagnostic Step",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.8,
      "reason": "The core lesson of the example is to not skip this step, which is strongly implied."
    },
    {
      "anchor_text": "Two-Speed Feedback",
      "target_title": "Two-Speed Feedback",
      "intent_type": "technique",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "A major section of the source text; this example is a candidate for applying that feedback method."
    },
    {
      "anchor_text": "Calibration Loop",
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.9,
      "reason": "Explicitly defined in the source text as a key learning process this scenario supports."
    },
    {
      "anchor_text": "Performance Under Stress",
      "target_title": "Performance Under Stress",
      "intent_type": "construct",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.7,
      "reason": "Linked to the source's point that recognition does not equal performance under pressure."
    },
    {
      "anchor_text": "Conflict Resolution",
      "target_title": "Conflict Resolution",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.3,
      "reason": "Mentioned as a potential adaptation in the gap statement, not in the source."
    },
    {
      "anchor_text": "Stakeholder Management",
      "target_title": "Stakeholder Management",
      "intent_type": "concept",
      "stub_policy": "ignore",
      "confidence": 0.3,
      "reason": "Mentioned as a potential adaptation in the gap statement, not in the source."
    }
  ]
}