## LINK RATIONALIZATION (MANDATORY)

For each outgoing link you add or keep, assign:
- relation_type: prerequisite | variant | contrasts_with | applies_to | example_of | pitfall_of | supports | challenges
- rationale: 1 sentence explaining why the link exists

Emit a machine-readable appendix called EDGE_RECORDS as JSON lines:
{"from_note_id":"...","to_title":"...","relation_type":"...","rationale":"...","confidence":0.0}
Only include links you are confident are useful for navigation (avoid trivial mentions).
