---
verified: true
verified_at: 2026-01-08T19:12:02.068Z
id: friction-budget
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load", "learner engagement", "mental effort", "instructional design", "deliberate practice"]
---
# Friction Budget

## Definition
The Friction Budget is the maximum amount of mental effort a learner can expend on a learning unit before they disengage, quit, or resort to superficial strategies like guessing. It is a finite resource in instructional design that must be managed carefully.

## Key Components
While the concept itself is presented as a single budget, its management involves understanding factors that deplete it:
- **Information Volume**: Too many new terms or concepts introduced at once.
- **Procedural Complexity**: Requiring too many steps to complete a task.
- **Interface Switching**: Excessive navigation or context switching between screens or materials.

## Application
Designers should consciously allocate the friction budget towards activities that directly promote skill transfer (author's "Rung D"), such as practice under realistic constraints. Exceeding the budget causes learners to abandon [[deliberate practice]] and default to passive reading. The concept challenges the misconception that "more content means more learning," as extra content can raise friction without improving outcomes.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[deliberate practice]], [[cognitive load]]

## LINK_INTENTS
```json
{
  "note_id": "friction-budget",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "concept",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "performance assessment"],
      "reason": "The Friction Budget is discussed in the context of spending effort to buy transfer, which is the highest rung on the Outcome Ladder."
    },
    {
      "target_title": "cognitive load",
      "intent_type": "prerequisite",
      "confidence": 0.8,
      "embedding_match_keys": ["mental effort", "instructional design", "learning capacity"],
      "reason": "The source text lists 'cognitive load' as a background idea the Friction Budget relies upon, both dealing with limits on mental processing."
    },
    {
      "target_title": "deliberate practice",
      "intent_type": "concept",
      "confidence": 0.8,
      "embedding_match_keys": ["focused practice", "skill improvement", "performance"],
      "reason": "Exceeding the Friction Budget causes learners to stop engaging in deliberate practice, making it a key related concept."
    }
  ]
}