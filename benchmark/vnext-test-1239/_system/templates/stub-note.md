---
id: stub-template-v1
type: template
description: Template for generating stub notes. Variables are replaced by code.
vars:
  - stub_id: The slug ID for the stub
  - stub_type: concept, procedure, principle, etc.
  - stub_title: Human-readable title
  - reason: Why this term was linked (from LINK_INTENT)
---

---
id: {{stub_id}}
type: {{stub_type}}
status: stub
tags: [{{stub_type}}, stub, ai-generated]
---

# {{stub_title}}

> ⚠️ **AI-Generated Stub** - This content is inferred from context and requires verification.

## Scope (AI-Inferred)
{{reason}}

## Open Questions
- What is the precise definition of "{{stub_title}}"?
- How does it relate to other concepts in this vault?
- What are the key examples or use cases?

## Links
*Pending - will be populated when grounded content is extracted*
