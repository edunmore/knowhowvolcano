---
verified: true
verified_at: 2026-01-08T19:13:13.845Z
id: prefer-fewer-stronger-links
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["note-taking", "knowledge structure", "conceptual linking", "cognitive load"]
---
# Prefer Fewer, Stronger Links

## Rule
A note or knowledge system should connect ideas so a learner can navigate between them, but links should be used sparingly, reserved for stable concepts, named models, or repeated prerequisites.

## Rationale
Linking every noun creates noise and cognitive overhead, which can exceed a learner's [[Friction Budget]]. Strong, meaningful links to core concepts support efficient navigation and deeper understanding, while leaving other terms as plain text until they prove necessary avoids overwhelming the learner.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "prefer-fewer-stronger-links",
  "link_intents": [
    {
      "target_title": "Friction Budget",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["cognitive load", "mental effort", "learning efficiency"],
      "reason": "The principle directly relates to managing cognitive load by avoiding link noise, a key component of the Friction Budget concept."
    }
  ]
}