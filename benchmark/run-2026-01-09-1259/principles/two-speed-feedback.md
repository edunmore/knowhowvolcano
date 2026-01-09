---
verified: true
verified_at: 2026-01-09T12:00:10.193Z
id: two-speed-feedback
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback design", "cognitive load", "transfer of learning", "instructional scaffolding", "deliberate practice"]
---
# Two-Speed Feedback

## Rule
Instructional feedback should be delivered in two layers: a fast, memorable rule of thumb for real-time application, followed by a slower, deeper explanation of the underlying principle and its limitations.

## Rationale
This structure balances the needs of performance and understanding. The fast layer "prevents overthinking" during live application, such as a conversation, by providing a simple heuristic. The slow layer "prevents blind habit" by explaining why the rule works and when it fails, which is essential for deeper [[calibration]] and [[transfer of learning]] across contexts.

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
      "reason": "Two-Speed Feedback is a design element within a microlearning loop that targets specific rungs of the Outcome Ladder."
    },
    {
      "target_title": "Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["expert comparison", "decision commitment", "feedback calibration"],
      "reason": "The slow, explanatory layer of Two-Speed Feedback directly supports the calibration process by helping learners understand the difference between their choice and an expert's."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "principle",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design constraint"],
      "reason": "Two-Speed Feedback is a technique for managing cognitive load (friction) by strategically separating immediate application from deeper understanding."
    }
  ]
}