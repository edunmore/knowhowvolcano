---
verified: true
verified_at: 2026-01-08T19:12:23.242Z
id: two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["layered feedback", "cognitive feedback", "performance support", "rule of thumb", "transfer of learning"]
---
# Two-Speed Feedback

## Rule
Instructional feedback should be delivered in two layers: a fast, actionable rule of thumb for immediate application, followed by a slow, explanatory layer that provides the underlying rationale and limitations.

## Rationale
The fast layer provides a cognitive shortcut a learner can recall and apply during live performance (e.g., a conversation), preventing overthinking. The slow layer explains why the rule works and when it fails, preventing the formation of a blind habit and supporting deeper understanding for transfer to different contexts. This approach manages [[Friction Budget]] by allocating mental effort effectively.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]], [[Outcome Ladder]]

## LINK_INTENTS
```json
{
  "note_id": "two-speed-feedback",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "deliberate practice"],
      "reason": "Two-speed feedback is a design principle for managing the learner's cognitive load, which is the core concern of the Friction Budget."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.7,
      "embedding_match_keys": ["performance levels", "skill transfer", "competence assessment"],
      "reason": "The principle supports achieving higher rungs on the Outcome Ladder (like Perform and Transfer) by providing feedback suited for real-world application."
    }
  ]
}