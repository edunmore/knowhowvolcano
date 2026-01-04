// Prompt renderer (Handlebars + gray-matter) + minimal validation hook.
// Use Zod or AJV in your codebase. This file is illustrative and can be copied into your project.

import fs from "node:fs/promises";
import matter from "gray-matter";
import Handlebars from "handlebars";

Handlebars.registerHelper("json", (x: unknown) => JSON.stringify(x, null, 2));
Handlebars.registerHelper("join", (xs: unknown[], sep: string) => (xs ?? []).join(sep));

export type PromptFrontmatter = {
  id: string;
  type: "system_prompt";
  engine?: "handlebars";
  vars?: Record<string, { type: "string" | "number" | "boolean" | "array"; required?: boolean; items?: "string" }>;
};

export async function renderPrompt(notePath: string, ctx: Record<string, unknown>) {
  const raw = await fs.readFile(notePath, "utf-8");
  const parsed = matter(raw);
  const fm = parsed.data as PromptFrontmatter;

  for (const [k, spec] of Object.entries(fm.vars ?? {})) {
    if (spec.required && !(k in ctx)) {
      throw new Error(`Missing required prompt var: ${k}`);
    }
  }

  const template = Handlebars.compile(parsed.content, { noEscape: true });
  return template(ctx);
}
