---
verified: true
verified_at: 2026-01-10T19:49:46.723Z
id: two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback design", "cognitive load", "performance transfer", "rule of thumb", "deliberate practice"]
---
# Two-Speed Feedback

## Rule
Feedback should be structured in two layers: a fast, memorable rule of thumb for use in live situations, followed by a slow, explanatory layer detailing the underlying rationale and its limitations.

## Rationale
This approach balances immediate usability with deeper understanding. The fast layer prevents cognitive overload and overthinking during performance, allowing the learner to apply the skill under pressure. The slow layer prevents the formation of blind habits by explaining the "why" behind the rule and the conditions under which it may fail, supporting long-term [[Outcome Ladder#Transfer|transfer]] and [[Calibration Loop|calibration]].

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[Calibration Loop]]

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
      "reason": "The principle is part of a design loop that targets specific rungs of the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "deliberate practice"],
      "reason": "Two-speed feedback is a design choice that strategically manages cognitive load within the Friction Budget."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["expert comparison", "decision commitment", "feedback"],
      "reason": "The explanatory layer of feedback directly supports the calibration process by helping learners understand expert reasoning."
    }
  ]
}