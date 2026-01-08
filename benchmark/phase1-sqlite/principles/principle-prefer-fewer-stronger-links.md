---
verified: true
verified_at: 2026-01-08T19:00:01.427Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge representation", "concept mapping", "prerequisite structure", "instructional design", "cognitive load"]
---
# Prefer Fewer, Stronger Links

## Rule
When designing a note or knowledge system, prioritize creating a limited number of connections that point to stable, foundational concepts, rather than linking every possible term.

## Rationale
Excessive linking "creates noise" and impedes the learner's ability to navigate between key ideas efficiently. Effective links should point to "stable concepts, named models, or repeated prerequisites," which supports [[The Calibration Loop]] by clarifying core relationships. This principle helps manage the learner's [[Friction Budget]] by reducing cognitive overhead from navigating irrelevant connections.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[The Calibration Loop]], [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "The Calibration Loop",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["calibration", "expert comparison", "feedback loop"],
      "reason": "This principle supports effective calibration by ensuring links highlight core, stable concepts for comparison."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning design"],
      "reason": "Applying this principle helps manage cognitive load by reducing navigational noise, directly relating to the Friction Budget."
    }
  ]
}