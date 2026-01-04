// Minimal evaluation runner skeleton (property-based expectations + metrics gates).
// This is illustrative. Wire it into your Volcano workflow and existing indexing/QA outputs.

import fs from "node:fs/promises";
import path from "node:path";

type Expectation = {
  id: string;
  input_files: string[];
  min_notes_by_type?: Record<string, number>;
  must_create_types?: string[];
  hard_gates?: Record<string, number>;
};

type Metrics = {
  link_resolution_rate: number;
  required_sections_rate: number;
  primary_objective_uniqueness_rate: number;
  provenance_coverage_rate: number;
  storyboard_beat_link_coverage: number;
  notes_by_type: Record<string, number>;
};

export async function loadJson<T>(p: string): Promise<T> {
  return JSON.parse(await fs.readFile(p, "utf-8"));
}

export function checkExpectation(exp: Expectation, m: Metrics) {
  const failures: string[] = [];

  for (const [k, min] of Object.entries(exp.min_notes_by_type ?? {})) {
    const got = m.notes_by_type?.[k] ?? 0;
    if (got < min) failures.push(`min_notes_by_type.${k}: expected >= ${min}, got ${got}`);
  }

  for (const t of exp.must_create_types ?? []) {
    const got = m.notes_by_type?.[t] ?? 0;
    if (got < 1) failures.push(`must_create_types: missing ${t}`);
  }

  for (const [k, target] of Object.entries(exp.hard_gates ?? {})) {
    const got = (m as any)[k];
    if (typeof got !== "number") failures.push(`hard_gate.${k}: metric missing`);
    else if (got < target) failures.push(`hard_gate.${k}: expected >= ${target}, got ${got}`);
  }

  return failures;
}

export async function runEval(expectationsDir: string, metricsDir: string) {
  const files = await fs.readdir(expectationsDir);
  const results: Record<string, { failures: string[] }> = {};

  for (const fn of files.filter(f => f.endsWith(".json"))) {
    const exp = await loadJson<Expectation>(path.join(expectationsDir, fn));
    const metrics = await loadJson<Metrics>(path.join(metricsDir, `${exp.id}.metrics.json`));
    results[exp.id] = { failures: checkExpectation(exp, metrics) };
  }

  return results;
}
