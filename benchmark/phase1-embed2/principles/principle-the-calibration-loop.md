---
verified: true
verified_at: 2026-01-08T18:52:57.867Z
id: principle-the-calibration-loop
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["feedback comparison", "expert modeling", "decision commitment", "hidden variables", "performance calibration"]
---
# The Calibration Loop

## Rule
A learner's ability to accurately self-assess improves fastest when they must commit to a decision before seeing an expert answer, and when the feedback explicitly names the underlying reasoning factor (e.g., risk, trust, time, power, or uncertainty).

## Rationale
This principle counters the misconception that recognition equals performance. According to the source, "Calibration improves fastest when the learner must commit to a decision before seeing the answer, and when the feedback names the hidden variable". This process directly addresses [[interference under stress]] by strengthening the mental models needed for [[transfer (Stage 4)]] to real-world contexts, moving beyond simple recall or recognition.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[The Outcome Ladder]], [[Two-Speed Feedback]], [[interference under stress]]

## LINK_INTENTS
```json
{
  "note_id": "principle-the-calibration-loop",
  "link_intents": [
    {
      "target_title": "The Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer", "performance assessment"],
      "reason": "The Calibration Loop is a method for achieving the higher rungs of the Outcome Ladder, specifically performance and transfer."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert explanation"],
      "reason": "The Calibration Loop's feedback on hidden variables aligns with the 'slow layer' of Two-Speed Feedback, which provides deeper explanatory reasoning."
    },
    {
      "target_title": "interference under stress",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["performance degradation", "stress", "cognitive load"],
      "reason": "The text states that transfer requires practice under constraints and implies the Calibration Loop helps overcome interference under stress."
    }
  ]
}