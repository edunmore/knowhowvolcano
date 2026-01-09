---
verified: true
verified_at: 2026-01-09T09:55:24.875Z
id: two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback layers", "instructional feedback", "cognitive load", "rule of thumb", "transfer of learning"]
---
# Two-Speed Feedback

## Rule
Instructional feedback should be delivered in two layers: a fast, memorable rule of thumb for use in real-time, and a slow, deeper explanation of the underlying rationale and its limitations.

## Rationale
The fast layer prevents overthinking during performance, while the slow layer prevents the formation of blind habits by ensuring the learner understands the context and constraints of the rule. This approach manages cognitive load by separating immediate application from deeper conceptual understanding, which is essential for [[transfer]] under pressure.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[7-Minute Microlearning Loop]]

## LINK_INTENTS
```json
{
  "note_id": "two-speed-feedback",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "Feedback design is tied to targeting specific rungs (levels) of the Outcome Ladder for effective skill development."
    },
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning design", "instructional loop", "scenario practice"],
      "reason": "Two-speed feedback is explicitly listed as Step 6 in this core design procedure."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "The principle of two-speed feedback aligns with managing cognitive friction by separating simple and complex information."
    }
  ]
}