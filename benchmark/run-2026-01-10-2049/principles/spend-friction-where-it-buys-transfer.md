---
verified: true
verified_at: 2026-01-10T19:49:33.024Z
id: spend-friction-where-it-buys-transfer
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load management", "deliberate practice", "learning transfer", "instructional design", "effort allocation"]
---
# Spend Friction Where It Buys Transfer

## Rule
A designer should strategically allocate mental effort (friction) within a learning unit only where it directly contributes to the learner's ability to apply a skill in a new context under pressure.

## Rationale
Every learning unit has a limited "friction budget"; exceeding it causes learners to quit or guess. The goal is not to eliminate all difficulty, but to ensure that the required effort is spent on activities that lead to [[Transfer (Level D)]] rather than on superficial content. As stated, "extra content can raise friction without improving transfer."

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]], [[Outcome Ladder]], [[Transfer (Level D)]]

## LINK_INTENTS
```json
{
  "note_id": "spend-friction-where-it-buys-transfer",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning unit design"],
      "reason": "This principle is the application guideline for managing the Friction Budget concept."
    },
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "performance levels", "competence stages"],
      "reason": "The principle guides where to spend friction to achieve higher rungs (levels) on the Outcome Ladder, especially transfer."
    },
    {
      "target_title": "Transfer (Level D)",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["skill application", "context adaptation", "performance under stress"],
      "reason": "The principle's explicit goal is to buy 'transfer,' which is defined as Level D (Rung D) on the Outcome Ladder."
    }
  ]
}