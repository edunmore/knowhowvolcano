# Edu Zettelkasten Benchmark v1

This benchmark is original text (no copyrighted source).

Run your pipeline on `benchmark_source_raw.md`.
Use `benchmark_source_annotated.md` as a hint for link density.
Use `benchmark_expected.json` as a minimal “gold” list (titles/types + link intents).

A quick sanity check: if your system outputs 30+ inline links from this text, your linking heuristic is too granular.



Remarks for agent: check out this benchmark data, you are allowed to improve and give your own suggestions or create your own benchmark file. The goal is to have some sample content which is modelled upfront and can be used to evaluate the system in a better more deterministic way. 

Recommended to have multiple benchmark run vaults after changes for comparison, e.g. --vault ./benchmark/benchmarktest-day-time
