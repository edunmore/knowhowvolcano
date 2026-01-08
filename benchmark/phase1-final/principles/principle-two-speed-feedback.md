---
verified: true
verified_at: 2026-01-08T18:24:06.384Z
id: principle-two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback design", "rule of thumb", "explanation layer", "performance support", "transfer of learning"]
---
# Two-Speed Feedback

## Rule
Feedback should be delivered in two layers: a fast, memorable rule of thumb for immediate use, followed by a slower, deeper explanation of the underlying principle and its limitations.

## Rationale
The fast layer "prevents overthinking" during performance, such as a live conversation, by providing a simple heuristic the learner can recall under pressure. The slow layer "prevents blind habit" by explaining why the rule works and when it might fail, fostering deeper understanding and [[transfer of learning]].

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Outcome Ladder]], [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "principle-two-speed-feedback",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "scenario", "feedback loop"],
      "reason": "Two-Speed Feedback is explicitly described as Step 6 in this design procedure."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["performance levels", "learning progression", "competence"],
      "reason": "The principle is part of a toolbox for designing to specific performance rungs (e.g., Stage: Perform, Stage: Transfer)."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "learning effort", "mental effort"],
      "reason": "The principle helps manage cognitive load by structuring feedback efficiently to support transfer without unnecessary friction."
    }
  ]
}