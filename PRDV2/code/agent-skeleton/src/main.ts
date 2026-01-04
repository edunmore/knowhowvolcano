// Minimal Volcano SDK orchestration skeleton (illustrative)
//
// This is not a full implementation. It shows how the PRD maps to Volcano concepts.
// Replace file IO + indexing with your project’s implementations.

import { agent, llmOpenAI, mcp } from "volcano-sdk";

const llm = llmOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
});

const fsTools = mcp(process.env.MCP_FS_SERVER_URL ?? "http://localhost:8010/mcp");
const embedTools = mcp(process.env.MCP_EMBED_SERVER_URL ?? "http://localhost:8020/mcp");

export async function runIngestionPipeline(inputPath: string, vaultDir: string) {
  const coordinator = agent({ llm, name: "coordinator", description: "Runs education zettelkasten pipeline" });

  const results = await coordinator
    .then({
      prompt: `Ingest the chapter at ${inputPath} into the vault at ${vaultDir}. Create or update a source_anchor note and write a run manifest.`,
      mcps: [fsTools],
    })
    .then({
      prompt: `Extract candidate atomic modeled notes from ${inputPath} and write them to ${vaultDir}/_staging/. Use the schema in ${vaultDir}/../docs/NOTE_TYPES_AND_LINKS.md.`,
      mcps: [fsTools],
    })
    .then({
      prompt: `Model the staging notes into canonical education notes under ${vaultDir} (concepts/procedures/misconceptions...). Ensure links + provenance.`,
      mcps: [fsTools],
    })
    .then({
      prompt: `Resolve wikilinks, create missing concept stubs, and rebuild indexes in ${vaultDir}/_index/.`,
      mcps: [fsTools, embedTools],
    })
    .then({
      prompt: `Generate one business-fable story pack for the most central new concept created in this run. Write to ${vaultDir}/stories/.`,
      mcps: [fsTools],
    })
    .run();

  return results;
}
