# Scripts Spec (I/O contracts)

## 1) route
Input:
- sourceDir
- startFile
- canonIndexFile
- maxFiles (default 4)

Output JSON:
{
  "mode": "DISCOVER" | "DELTA",
  "selectedFiles": ["..."],
  "kernelSketch": {...},
  "topCandidates": [{"method_id":"...", "estimated_score": 0-100}]
}

## 2) extract
Inputs:
- mode
- selectedFiles
- (if delta) matchedCanonEntryFile
- promptTemplatePath
- llmProvider config

Outputs:
- extraction.md (discover) OR delta.md (delta)
- extraction.json (normalized machine-readable form, optional)

## 3) critic
Inputs:
- extraction.md
- selectedFiles texts (or file paths)
- promptTemplatePath
Outputs:
- critic.md (scores + fix spec + any anchor issues)

## 4) match
Inputs:
- extraction.md
- canon index file
- canon methods dir
- maxCandidatesFull (default 3)
Outputs:
- match.json {matched_method_id|null, confidence, rationale, merge_guidance}

## 5) update
Inputs:
- decision update|new
- (if update) matched_method_id + patch instructions
- canonDir
Outputs:
- updated canon entry file (or new file)
- patch.md (human readable)
- updated run metadata

## 6) reindex
Inputs:
- canonDir ./canon/methods
- out index file
Outputs:
- refreshed METHODS-CANON-INDEX.md
- validation report

## 7) run (orchestrator)
Inputs:
- startFile
- sourceDir
- canonDir
- thresholds (scores)
- budgets (maxFiles, maxCandidatesFull, maxIterations)
Outputs:
- complete run folder with all intermediate outputs + final artifacts
