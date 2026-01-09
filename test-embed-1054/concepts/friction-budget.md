---
verified: true
verified_at: 2026-01-09T09:55:02.508Z
id: friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner motivation", "instructional design", "mental effort", "deliberate practice"]
---
# Friction Budget

## Definition
A friction budget is the maximum amount of mental effort a learner can expend on a learning unit before they disengage, quit, or resort to superficial strategies like guessing. It is a design constraint in instructional design, where excessive friction from complexity, new terms, or interface demands can prevent [[deliberate practice]].

## Key Components
The concept implies a trade-off: friction is a resource to be spent strategically.
- **Friction Generators**: Elements that consume the budget, such as introducing too many new concepts at once, requiring too many procedural steps, or forcing excessive navigation between screens.
- **Friction Allocation**: The principle that friction should be invested where it most effectively promotes skill [[transfer]] to real-world contexts, not merely avoided.

## Application
Designers must estimate and manage the friction budget when creating learning units. The goal is not to eliminate all difficulty but to ensure that the cognitive load imposed is purposeful and does not exceed the learner's capacity for sustained, effortful engagement. Exceeding the budget causes learners to "default to superficial reading."

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[deliberate practice]], [[transfer]]

## LINK_INTENTS
```json
{
  "note_id": "friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment", "skill transfer"],
      "reason": "The Friction Budget is discussed in the context of designing for specific rungs of the Outcome Ladder, emphasizing spending friction where it buys transfer."
    },
    {
      "target_title": "deliberate practice",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["focused practice", "skill improvement", "effortful learning"],
      "reason": "The text states that exceeding the friction budget causes learners to stop engaging in deliberate practice."
    },
    {
      "target_title": "transfer",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["skill application", "context adaptation", "real-world performance"],
      "reason": "The core principle of the Friction Budget is to allocate mental effort strategically to enable transfer of learning to new contexts."
    }
  ]
}