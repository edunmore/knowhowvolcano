---
description: How to build custom Volcano providers for embeddings and special operations
---

# Custom Providers for Embeddings and Special Operations

**Key Insight:** A Volcano provider is just a function that takes text input and returns text output. It doesn't have to call a language model - use this for embeddings, vector search, deterministic operations, or any external API.

## Provider Interface

```typescript
import type { LLMHandle } from "volcano-sdk";

type LLMHandle = {
  id: string;              // Unique identifier
  model: string;           // Model/operation name
  client: any;             // Your client (e.g., vector DB, API client)
  gen: (prompt: string) => Promise<string>;  // Main function (REQUIRED)
  genWithTools: (prompt: string, tools: ToolDefinition[]) => Promise<LLMToolResult>;  // Optional
  genStream: (prompt: string) => AsyncGenerator<string, void, unknown>;  // Optional
};
```

## Embedding Provider

```typescript
// src/providers/embedding.ts
import type { LLMHandle } from "volcano-sdk";

export function llmEmbedding(config: {
  apiKey: string;
  model: string;
}): LLMHandle {
  return {
    id: "embedding-provider",
    model: config.model,
    client: null,
    
    async gen(prompt: string): Promise<string> {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          input: prompt
        })
      });
      
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      // Return as JSON so it flows through Volcano context
      return JSON.stringify({ 
        embedding, 
        input: prompt,
        model: config.model 
      });
    },
    
    async genWithTools() {
      throw new Error("Embeddings don't support tool calling");
    },
    
    async *genStream() {
      throw new Error("Embeddings don't support streaming");
    }
  };
}
```

## Similarity Search Provider

```typescript
// src/providers/similarity-search.ts
import type { LLMHandle } from "volcano-sdk";

export function llmSimilaritySearch(config: {
  apiKey: string;
  embeddingModel: string;
  vectorStore: any;  // Pinecone, Weaviate, Qdrant, etc.
}): LLMHandle {
  return {
    id: "similarity-search",
    model: config.embeddingModel,
    client: config.vectorStore,
    
    async gen(prompt: string): Promise<string> {
      // Expect JSON input: { query: "search term", topK: 5, filter?: {...} }
      const params = JSON.parse(prompt);
      
      // 1. Generate embedding for query
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.embeddingModel,
          input: params.query
        })
      });
      
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      
      // 2. Query vector store
      const searchResults = await config.vectorStore.query({
        vector: embedding,
        topK: params.topK || 5,
        filter: params.filter
      });
      
      // 3. Return results as JSON
      return JSON.stringify({
        query: params.query,
        topK: params.topK || 5,
        results: searchResults.matches.map(match => ({
          id: match.id,
          text: match.metadata?.text || "",
          score: match.score,
          metadata: match.metadata
        }))
      });
    },
    
    async genWithTools() {
      throw new Error("Similarity search doesn't support tool calling");
    },
    
    async *genStream() {
      throw new Error("Similarity search doesn't support streaming");
    }
  };
}
```

## Usage in Workflows

```typescript
import { agent, llmOpenAI } from "volcano-sdk";
import { llmEmbedding } from "../providers/embedding";
import { llmSimilaritySearch } from "../providers/similarity-search";

const reasoningModel = llmOpenAI({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! });
const embedder = llmEmbedding({ apiKey: process.env.OPENAI_API_KEY!, model: "text-embedding-3-small" });
const search = llmSimilaritySearch({ apiKey: process.env.OPENAI_API_KEY!, embeddingModel: "text-embedding-3-small", vectorStore });

// Generate embeddings for chunks
const results = await agent({ llm: reasoningModel })
  .forEach(documentChunks, (chunk, a) => 
    a.then({ llm: embedder, prompt: chunk })
  )
  .then({ llm: reasoningModel, prompt: "Process and store all embeddings" })
  .run();

// Use similarity search
const searchResults = await agent({ llm: reasoningModel })
  .then({ 
    llm: search,
    prompt: JSON.stringify({ query: "machine learning safety", topK: 5 })
  })
  .then({ llm: reasoningModel, prompt: "Analyze the retrieved chunks" })
  .run();
```

## Other Custom Provider Use Cases

### Web Search Provider
```typescript
export function llmWebSearch(config: { apiKey: string }): LLMHandle {
  return {
    id: "web-search",
    model: "brave-search-api",
    client: null,
    async gen(prompt: string): Promise<string> {
      const params = JSON.parse(prompt);
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${params.query}`, {
        headers: { "X-Subscription-Token": config.apiKey }
      });
      const data = await response.json();
      return JSON.stringify(data.web.results.slice(0, params.limit || 5));
    },
    async genWithTools() { throw new Error("Not supported"); },
    async *genStream() { throw new Error("Not supported"); }
  };
}
```

### JSON Parser Provider (Deterministic)
```typescript
export function llmJsonParser(): LLMHandle {
  return {
    id: "json-parser",
    model: "deterministic",
    client: null,
    async gen(prompt: string): Promise<string> {
      try {
        const parsed = JSON.parse(prompt);
        return JSON.stringify({ success: true, data: parsed });
      } catch (error) {
        return JSON.stringify({ success: false, error: error.message });
      }
    },
    async genWithTools() { throw new Error("Not supported"); },
    async *genStream() { throw new Error("Not supported"); }
  };
}
```

### Database Query Provider
```typescript
export function llmDatabaseQuery(config: { client: any }): LLMHandle {
  return {
    id: "database-query",
    model: "postgresql",
    client: config.client,
    async gen(prompt: string): Promise<string> {
      const params = JSON.parse(prompt);
      const result = await config.client.query(params.sql, params.values);
      return JSON.stringify(result.rows);
    },
    async genWithTools() { throw new Error("Not supported"); },
    async *genStream() { throw new Error("Not supported"); }
  };
}
```

## Benefits of Custom Providers

1. **Everything stays in Volcano flow** - No breaking out to external functions
2. **Context flows automatically** - Results pass to next step seamlessly
3. **Composable** - Mix custom providers with LLMs in the same pipeline
4. **Type-safe** - Full TypeScript support
5. **Multi-provider workflows** - Different "models" for different tasks
6. **Testable** - Easy to mock and test in isolation
7. **Observable** - Works with Volcano's telemetry and hooks
