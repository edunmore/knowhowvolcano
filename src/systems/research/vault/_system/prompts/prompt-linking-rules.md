## LINKING & STUB INTENTS (MANDATORY)

Create link-intents while writing the note.

### 1) What to link

Create `[[...]]` links for:
- **Domain entities**: named models, frameworks, techniques, tools
- **Learner-friction terms**: metaphors used structurally (ladder/rung, lever, loop, flywheel)
- **Prerequisite concepts**: terms the author assumes the reader knows
- **Constructs/metrics**: measurements used as constructs (self-efficacy, stress response)
- **Authors/theories**: only if relevant for understanding

Detection heuristics for learner-friction:
- Term is capitalized, repeated, or used in headings
- Term appears in a definition-like sentence
- Term is a metaphor but used as a technical term in this context

Do NOT resolve links. Do NOT search the vault. Only mark intent.

### 2) Link target naming

Use **Title Case canonical titles**:
- `[[Psychological Safety]]`, `[[SMART Goals]]`, `[[TOTE Model]]`
- Prefer umbrella terms over niche synonyms
- Disambiguate only if necessary: `[[Anchoring (Cognitive Bias)]]`

### 3) Presupposition links

If the text presupposes X is known and X is not explained here, link X:
- "As you know..." → link the assumed concept
- "This builds on..." → link the prerequisite
- "Of course..." → link the hidden prerequisite

### 4) Link density

Target 5–20 inline links per note. Prefer fewer high-value links.

### 5) LINK_INTENTS Appendix (required)

At the END of the note, append this JSON block:

```json
{
  "note_id": "<the note's id>",
  "link_intents": [
    {
      "anchor_text": "<exact text you linked>",
      "target_title": "<the inside of [[...]]>",
      "intent_type": "concept|glossary|metaphor_construct|prerequisite|author|metric|tool",
      "stub_policy": "create_empty|create_with_ai_explanation|ignore",
      "confidence": 0.0,
      "reason": "<1 sentence>",
      "evidence": {
        "source_snippet": "<from context window>",
        "location_hint": "<optional>"
      }
    }
  ]
}
```

**Intent types:**
- `concept` - domain-specific defined term
- `glossary` - general term needing clarification
- `metaphor_construct` - metaphor used structurally as a term
- `prerequisite` - assumed prior knowledge
- `author` - person/theory reference
- `metric` - measurement construct
- `tool` - technique or method

**Stub policies:**
- `create_with_ai_explanation` - stub + AI-generated provisional explanation (conf ≥0.65)
- `create_empty` - stub with empty body (conf 0.35–0.65)
- `ignore` - don't create stub (conf <0.35, or term repeats elsewhere)

### 6) Verification rule

**Every `[[...]]` link in the body must appear once in `LINK_INTENTS`.**

### 7) Output ordering

1. Write note body with inline `[[...]]` links
2. Append `LINK_INTENTS` JSON block at the end
