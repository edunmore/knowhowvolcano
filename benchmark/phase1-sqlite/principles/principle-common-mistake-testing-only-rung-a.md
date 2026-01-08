---
verified: true
verified_at: 2026-01-08T18:58:04.948Z
id: principle-common-mistake-testing-only-rung-a
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["assessment validity", "learning progression", "performance transfer", "competence levels", "instructional design"]
---
# Common Mistake: Testing Only Rung A

## Rule
When designing assessments, do not only test the lowest level of recall (Level 1/Recall) and assume it indicates broader learning progress.

## Rationale
Focusing assessment on basic recall (author's "Rung A") leads to celebrating progress while real-world performance (at Levels 3/Perform or 4/Transfer) remains flat. Recognition is not performance; people can recall information but still fail to apply it under stress or in different contexts.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[interference under stress]]

## LINK_INTENTS
```json
{
  "note_id": "principle-common-mistake-testing-only-rung-a",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer"],
      "reason": "This principle is framed as a mistake related to the levels defined in the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.7,
      "embedding_match_keys": ["cognitive load", "instructional design", "deliberate practice"],
      "reason": "The text connects superficial assessment (Rung A) with learners defaulting to superficial reading when friction is mismanaged."
    },
    {
      "target_title": "interference under stress",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["performance degradation", "stress", "skill application"],
      "reason": "The rationale for the principle cites failure under stress as a key reason recall alone is insufficient."
    }
  ]
}