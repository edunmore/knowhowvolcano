# Architecture

## 1. Modules

### 1) SourceStore
Reads Markdown files and returns:
- raw text
- paragraph index map (by heading + paragraph index)
- optional line offsets (if available)

### 2) ChapterRouter
Inputs:
- chapterIndex: string[]
- startFile: string
- canonIndex: CanonIndex
Outputs:
- selectedFiles: string[] (<= maxFiles)
- mode: "DISCOVER" | "DELTA"
- topCandidates: [{method_id, estimated_score}]

### 3) Extractor
Two implementations:
- DiscoverExtractor(selectedFiles) -> ExtractionDoc
- DeltaExtractor(selectedFiles, matchedCanonEntry) -> DeltaDoc

### 4) Critic
Runs downstream stress test + evidence audit:
- Critic(extractionDoc, selectedFiles) -> CriticReport (scores + fix spec)

### 5) CanonMatcher
Index-first matching:
- shortlist from canon index
- open <= maxCandidates full entries
- output match decision + confidence

### 6) CanonUpdater
- apply patch to existing canon entry OR create new entry
- write changelog
- preserve provenance anchors

### 7) CanonIndexer
Regenerate compact index from method entry files.

### 8) Orchestrator
Wires the steps into an iterative loop with stop conditions.

## 2. Data Flow (per run)

route -> extract -> critic -> (iterate extract/route) -> match -> update -> reindex

## 3. Storage

- runs are immutable snapshots under `./runs/`
- canon is mutable under `./canon/`

## 4. Observability

- write a JSONL event stream per run (step start/end, selected files, scores, decisions)
- optionally export OpenTelemetry traces if desired

