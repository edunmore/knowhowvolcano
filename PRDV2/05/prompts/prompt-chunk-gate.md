Return ONLY valid JSON. No markdown. No commentary.

Allowed content_class (choose exactly one):
core, preface, notes_for_reader, toc, marketing_blurb, about_author, legal, references, index, appendix, unknown

Decision:
- FULL_MODEL: core learning content (definitions, explanations, frameworks, procedures, examples).
- LIGHT_SCAN: meta text that may contain assumptions/glossary/prereqs (preface, notes_for_reader).
- SKIP: marketing/testimonials/about-author/legal/TOC/index/reference lists.

Output JSON schema:
{
  "content_class": "<allowed value>",
  "relevance_score": <number 0.0..1.0>,
  "decision": "SKIP" | "LIGHT_SCAN" | "FULL_MODEL",
  "confidence": <number 0.0..1.0>,
  "reasons": ["<short reason 1>", "<short reason 2>", "<short reason 3>"]
}

Text evidence (snippets):
HEAD:
<<<{{head}}>>>

SIGNALS:
<<<{{signals}}>>>

TAIL:
<<<{{tail}}>>>
