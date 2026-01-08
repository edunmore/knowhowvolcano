---
verified: true
verified_at: 2026-01-08T18:43:19.745Z
id: principle-two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback design", "cognitive load", "rule of thumb", "knowledge transfer", "deliberate practice"]
---
# Two-Speed Feedback

## Rule
Instructional feedback should be delivered in two layers: a fast, memorable rule of thumb for immediate application, followed by a slower, deeper explanation of the underlying rationale and its limitations.

## Rationale
The fast layer prevents overthinking during live performance, such as a conversation, by providing a simple heuristic. The slow layer prevents the formation of blind habits by explaining why the rule works and when it might fail, thus supporting deeper [[calibration]] and long-term [[knowledge transfer]]. This approach respects the [[Friction Budget]] by not overwhelming learners with complex explanations during initial practice.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[Calibration Loop]]

## LINK_INTENTS
```json
{
  "note_id": "principle-two-speed-feedback",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "The principle is part of a design loop that begins with choosing a target level from the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "The two-speed design directly manages cognitive friction by separating immediate application from deeper understanding."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["expert comparison", "decision making", "feedback"],
      "reason": "The slow layer of feedback aids the calibration process by helping learners understand the difference between their choice and an expert's."
    }
  ]
}