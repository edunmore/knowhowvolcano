---
verified: true
verified_at: 2026-01-08T18:43:31.632Z
id: misconception-testing-only-recall-is-sufficient
type: misconception
tags: [misconception, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["recognition", "performance assessment", "skill transfer", "outcome measurement", "testing validity"]
---
# Testing Only Recall is Sufficient

## Misconception
The mistaken belief that if a learner can recall or recognize information (Level 1 or Level 2), they will be able to perform the skill effectively in real-world situations.

## Correction
Recall and recognition (Levels 1 and 2 of the [[Outcome Ladder]]) are not sufficient for real-world performance or transfer. True learning requires designing assessments and practice for higher levels: performing in realistic scenarios (Level 3) and transferring the skill under stress or in new contexts (Level 4). Testing only at the recall level leads to celebrating progress while actual performance remains flat.

```json
{
  "note_id": "misconception-testing-only-recall-is-sufficient",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "This misconception is explicitly framed as confusing the lower rungs (A/B) of the Outcome Ladder with true competence."
    },
    {
      "target_title": "Interference Under Stress",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_keys": ["performance degradation", "stress", "cognitive load"],
      "reason": "The source text mentions interference (freezing under pressure) as a key reason why recall alone fails, linking this to background ideas like 'interference under stress'."
    }
  ]
}