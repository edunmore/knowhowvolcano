---
verified: true
verified_at: 2026-01-10T19:49:25.891Z
id: friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner effort", "mental effort", "learning unit design", "deliberate practice"]
---
# Friction Budget

## Definition
A friction budget is the maximum amount of mental effort a learner can expend on a learning unit before disengaging or resorting to superficial strategies like guessing. It is a finite resource in instructional design that must be managed to facilitate [[deliberate practice]] and avoid cognitive overload.

## Key Components
The concept is defined by what consumes the budget and the consequence of exceeding it:
*   **Consuming Factors:** Friction increases when a learning unit requires too many new terms at once, too many procedural steps, or too much switching between contexts or screens.
*   **Consequence:** When the friction budget is exceeded, learners stop engaging in deliberate practice and default to less effective behaviors like passive reading.

## Application
The concept is applied by deliberately allocating friction towards activities that yield high learning gains, such as achieving transfer to new contexts, rather than eliminating all difficulty. Designers must be mindful of factors that unnecessarily deplete this budget, such as presenting excessive content or complex interfaces, which can hinder the target performance outcome.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[cognitive load]], [[deliberate practice]]

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
      "reason": "The Friction Budget is discussed in the context of designing for specific rungs of the Outcome Ladder, emphasizing spending friction where it 'buys transfer'."
    },
    {
      "target_title": "cognitive load",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["mental effort", "working memory", "instructional design"],
      "reason": "The source text explicitly lists 'cognitive load' as a background idea the Friction Budget relies upon, as both deal with managing learner mental effort."
    },
    {
      "target_title": "deliberate practice",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["focused practice", "skill improvement", "expert performance"],
      "reason": "Exceeding the friction budget causes learners to stop 'deliberate practice', making it a direct conceptual counterpoint within the text."
    }
  ]
}