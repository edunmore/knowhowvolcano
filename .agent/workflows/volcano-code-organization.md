---
description: Volcano SDK code organization rules (Always-on)
---

# Code Organization Rules

**CRITICAL:** Separate agent definitions from workflow orchestration. Keep main files clean.

## File Structure
```
src/
  agents/
    chunking.ts      // Chunking agents
    extracting.ts    // Extraction/modeling
    embedding.ts     // Embeddings & search
    analysis.ts      // Analysis agents
  workflows/
    pipeline.ts      // Main orchestration
  index.ts
```

## Agent Definition Files

Create separate files for each functional area:

```typescript
// src/agents/chunking.ts
import { agent, llmOpenAI } from "volcano-sdk";

const cheapModel = llmOpenAI({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY! });

export const documentChunker = agent({ llm: cheapModel })
  .then({ prompt: "Split document into semantic chunks of 500-1000 words" })
  .then({ prompt: "Return as JSON array of chunks" });

export const chunkValidator = agent({ llm: cheapModel })
  .then({ prompt: "Validate chunk boundaries and context preservation" });
```

```typescript
// src/agents/embedding.ts
import { llmSimilaritySearch } from "./providers/similarity-search";
import { pineconeClient } from "../config/vector-store";

export const similaritySearch = llmSimilaritySearch({
  apiKey: process.env.OPENAI_API_KEY!,
  embeddingModel: "text-embedding-3-small",
  vectorStore: pineconeClient
});

export const embeddingGenerator = llmEmbedding({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "text-embedding-3-small"
});
```

```typescript
// src/agents/extracting.ts
import { agent, llmAnthropic } from "volcano-sdk";

const smartModel = llmAnthropic({ 
  model: "claude-3-5-sonnet-20241022", 
  apiKey: process.env.ANTHROPIC_API_KEY! 
});

export const conceptExtractor = agent({ 
  llm: smartModel, 
  name: "concept-extractor",
  description: "Extracts key concepts, entities, and relationships from text"
})
  .then({ prompt: "Extract key concepts and entities from the text" })
  .then({ prompt: "Structure as JSON with concepts, entities, and relationships" });

export const relationshipModeler = agent({ llm: smartModel })
  .then({ prompt: "Model semantic relationships between extracted entities" })
  .then({ prompt: "Create knowledge graph structure" });
```

## Main Workflow Orchestration

Keep the main workflow clean by importing agent components:

```typescript
// src/workflows/knowledge-extraction.ts
import { agent, llmOpenAI, mcpStdio } from "volcano-sdk";
import { documentChunker } from '../agents/chunking';
import { conceptExtractor, relationshipModeler } from '../agents/extracting';
import { similaritySearch } from '../agents/embedding';

const coordinator = llmOpenAI({ 
  model: "gpt-4o-mini", 
  apiKey: process.env.OPENAI_API_KEY! 
});

const filesystem = mcpStdio({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem"],
  env: { ALLOWED_PATHS: process.cwd() }
});

// Clean, readable main workflow
export const knowledgeExtractionPipeline = async (docPath: string) => {
  return await agent({ llm: coordinator })
    .then({ 
      prompt: `Load document from ${docPath}`, 
      mcps: [filesystem] 
    })
    .runAgent(documentChunker)
    .forEach(chunks, (chunk, a) => 
      a.runAgent(conceptExtractor)
    )
    .runAgent(relationshipModeler)
    .then({ 
      prompt: "Save knowledge graph to ./output/graph.json", 
      mcps: [filesystem] 
    })
    .run({
      onStep: (result, index) => {
        console.log(`✓ Step ${index + 1}: ${result.durationMs}ms`);
      }
    });
};
```

## Benefits

- **Clean separation:** Main workflow focuses on orchestration, not implementation details
- **Reusability:** Agent definitions can be used across multiple workflows
- **Testability:** Easy to test individual agents in isolation
- **Collaboration:** Team members can work on different agent files without conflicts
- **Maintainability:** Changes to agent behavior are isolated to specific files
- **Clarity:** Each file has a single, clear responsibility (chunking, extraction, embedding, etc.)

## Testing Individual Agents

```typescript
// src/agents/__tests__/chunking.test.ts
import { documentChunker } from '../chunking';

describe('Document Chunker', () => {
  it('should split document into chunks', async () => {
    const results = await documentChunker
      .then({ prompt: "Test document content..." })
      .run();
    
    expect(results.length).toBeGreaterThan(0);
    const chunks = JSON.parse(results.at(-1)?.llmOutput || "[]");
    expect(Array.isArray(chunks)).toBe(true);
  });
});
```

## Anti-Pattern: Everything in One File

**DON'T do this:**

```typescript
// ❌ BAD: src/workflows/knowledge-extraction.ts (too much in one file)
import { agent, llmOpenAI } from "volcano-sdk";

const llm = llmOpenAI({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY! });

// Chunking agents defined inline
const chunker = agent({ llm }).then({ prompt: "Split..." });
const validator = agent({ llm }).then({ prompt: "Validate..." });

// Extraction agents defined inline  
const extractor = agent({ llm }).then({ prompt: "Extract..." });
const modeler = agent({ llm }).then({ prompt: "Model..." });

// Embedding provider defined inline
const search = llmSimilaritySearch({ ... });

// Finally the workflow
export const pipeline = agent({ llm })
  .runAgent(chunker)
  .runAgent(extractor)
  // ... rest of workflow
```

This makes the file:
- Hard to navigate (100s of lines)
- Difficult to reuse components
- Impossible to test in isolation
- Prone to merge conflicts
- Unclear responsibilities
