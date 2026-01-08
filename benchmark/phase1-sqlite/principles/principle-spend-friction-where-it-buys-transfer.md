---
verified: true
verified_at: 2026-01-08T18:58:35.623Z
id: principle-spend-friction-where-it-buys-transfer
type: principle
tags: [principle, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["cognitive load allocation", "instructional design efficiency", "effortful practice", "learning transfer", "deliberate practice"]
---
# Spend Friction Where It Buys Transfer

## Rule
A learning unit should strategically allocate its limited "friction budget" to mental activities that directly contribute to the ability to transfer skills to new contexts, rather than making everything easy or adding friction indiscriminately.

## Rationale
Every learning unit has a finite amount of learner effort (a "friction budget") before they disengage. Exceeding this budget causes learners to revert to superficial reading instead of [[Deliberate Practice]]. The principle argues against the misconception that "more content means more learning," as extra content can raise friction without improving transfer. Instead, friction—such as effortful thinking, scenario-based choices, and spaced repetition—should be invested specifically in exercises that build toward higher-level outcomes like performance and transfer (as defined on the [[Outcome Ladder]]), not on unnecessary complexity or passive recall.

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[Outcome Ladder]], [[Friction Budget]], [[Two-Speed Feedback]]

## LINK_INTENTS
```json
{
  "note_id": "principle-spend-friction-where-it-buys-transfer",
  "link_intents": [
    {
      "target_title": "Outcome Ladder",
      "intent_type": "prerequisite",
      "confidence": 0.9,
      "embedding_match_keys": ["learning progression", "competence levels", "skill transfer", "performance assessment"],
      "reason": "The principle defines effective friction as that which buys transfer, which is the highest rung (Stage D) on the referenced Outcome Ladder."
    },
    {
      "target_title": "Friction Budget",
      "intent_type": "concept",
      "confidence": 0.95,
      "embedding_match_keys": ["cognitive load", "mental effort", "learner engagement", "instructional design"],
      "reason": "This principle is a direct guideline for how to manage the finite cognitive resource explicitly named as the 'Friction Budget' in the source."
    },
    {
      "target_title": "Two-Speed Feedback",
      "intent_type": "procedure",
      "confidence": 0.8,
      "embedding_match_keys": ["feedback layers", "rule of thumb", "expert calibration", "instructional feedback"],
      "reason": "Two-Speed Feedback is presented as a related procedural element that works in concert with this principle to manage friction and promote transfer."
    }
  ]
}