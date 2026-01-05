Return ONLY valid JSON that conforms to the Normalized Knowledge Manifest (NKM) schema. No markdown. No commentary.

Task: Read the educational artifact text and extract knowledge explicitly present.

Rules:
- Do not invent new concepts or details.
- If something is implied but not stated, omit it.
- Provide evidence anchors as artifact_line_ranges [start_line, end_line] for each item (and key facets if possible).
- Map to canonical_id ONLY if confident. Otherwise canonical_id = null.
- You may read canonical_index_path for ID/alias matching. Do not read other vault content.

Inputs:
- topic_id: {{topic_id}}
- canonical_index_path: {{canonical_index_path}}
- artifact_path: {{artifact_path}}

Output:
- NKM JSON with source = "recovered"
