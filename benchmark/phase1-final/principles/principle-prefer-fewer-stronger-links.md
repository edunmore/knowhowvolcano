---
verified: true
verified_at: 2026-01-08T18:24:56.123Z
id: principle-prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["knowledge linking", "information architecture", "cognitive load", "instructional design", "concept mapping"]
---
# Prefer Fewer, Stronger Links

## Rule
In an educational note system, create connections that are minimal and meaningful, linking only to stable concepts or essential prerequisites, rather than linking every possible term.

## Rationale
Linking every noun creates noise and increases [[cognitive load]], hindering the learner's ability to navigate and understand the material. Strong links to core concepts, named models, or repeated prerequisites provide a clear, usable structure that supports learning transfer without overwhelming the user.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[cognitive load]]

## LINK_INTENTS
```json
{
  "note_id": "principle-prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "The principle of strong linking supports designing for higher rungs like transfer, which is a goal of the Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "instructional design"],
      "reason": "Excessive linking contributes to cognitive friction, which is managed by the Friction Budget principle."
    },
    {
      "target_title": "cognitive load",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["working memory", "mental effort", "learning efficiency"],
      "reason": "The text explicitly references 'cognitive load' as a background idea, and the principle directly aims to reduce extraneous load from poor information structure."
    }
  ]
}