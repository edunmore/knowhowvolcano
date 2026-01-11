import fs from "node:fs/promises";
import matter from "gray-matter";
import Handlebars from "handlebars";
import { resolve } from "node:path";

// Register generic helpers
Handlebars.registerHelper("json", (x: unknown) => JSON.stringify(x, null, 2));
Handlebars.registerHelper("join", (xs: unknown[], sep: string) => (Array.isArray(xs) ? xs.join(sep) : ""));

export type PromptFrontmatter = {
    id: string;
    type: "system_prompt";
    engine?: "handlebars";
    vars?: Record<string, { type: "string" | "number" | "boolean" | "array"; required?: boolean; items?: "string" }>;
};

/**
 * Render a prompt file with the given context.
 * 
 * @param notePath Absolute path to the prompt file (or relative to cwd)
 * @param ctx Variables to inject into the template
 */
export async function renderPrompt(notePath: string, ctx: Record<string, unknown>): Promise<string> {
    const absolutePath = resolve(notePath);

    try {
        const raw = await fs.readFile(absolutePath, "utf-8");
        const parsed = matter(raw);
        const fm = parsed.data as PromptFrontmatter;

        // Validate required variables
        if (fm.vars) {
            for (const [k, spec] of Object.entries(fm.vars)) {
                if (spec.required && !(k in ctx)) {
                    throw new Error(`Missing required prompt var: '${k}' in prompt '${fm.id || notePath}'`);
                }
            }
        }

        // Compile and run template
        // noEscape: true because we want to inject Markdown usually, not HTML-escaped text
        const template = Handlebars.compile(parsed.content, { noEscape: true });
        return template(ctx);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            throw new Error(`Prompt file not found at: ${absolutePath}`);
        }
        throw err;
    }
}
