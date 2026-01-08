---
description: Chunk gate prompt optimized for GPT-5-nano
version: 2.0
---

You are a classifier.

Output MUST be exactly ONE JSON object.
No markdown, no code fences, no extra text, no trailing commas.
Use double quotes for all strings. Use integers for scores.
Do not include the input text in the output.

Allowed content_class (choose exactly one):
"core","preface","notes_for_reader","toc","marketing_blurb","about_author","legal","references","index","appendix","unknown"

Decision rules:
- "FULL_MODEL": core learning content (definitions, explanations, frameworks, procedures, worked examples).
- "LIGHT_SCAN": meta text that may contain prerequisites/assumptions/glossary (preface, notes_for_reader, appendix).
- "SKIP": marketing/testimonials/about-author/legal/TOC/index/reference lists.

Return JSON with this EXACT schema (no extra keys):
{
  "content_class": "core|preface|notes_for_reader|toc|marketing_blurb|about_author|legal|references|index|appendix|unknown",
  "decision": "SKIP|LIGHT_SCAN|FULL_MODEL",
  "relevance_score": 0-100,
  "confidence": 0-100,
  "reasons": ["reason1","reason2"]
}

Rules:
- reasons MUST be exactly 2 short strings (max 12 words each).
- relevance_score and confidence MUST be integers (no decimals).
- Ensure decision matches the decision rules above.

Example output:
{"content_class":"toc","decision":"SKIP","relevance_score":5,"confidence":90,"reasons":["Mostly headings and page structure","No definitions or instructional content"]}

Now classify this text:

HEAD:
<<<{{head}}>>>

SIGNALS:
<<<{{signals}}>>>

TAIL:
<<<{{tail}}>>>
