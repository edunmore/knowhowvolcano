# Implementation Checklist (v0.1)

1) Create Node/TS project and install volcano-sdk.
2) Implement markdown loader with heading+paragraph indexing.
3) Implement router step (canon-aware).
4) Implement discover extractor runner (prompt template + selected sources injection).
5) Implement delta extractor runner.
6) Implement critic runner + parse scores + fix spec.
7) Implement iterative loop with stop conditions and max iterations.
8) Implement canon index parse + candidate retrieval + open <=3 entries.
9) Implement canon updater (write patch, apply changes, update changelog).
10) Implement index regenerator.
11) Persist run artifacts under ./runs/ with JSONL logs.
