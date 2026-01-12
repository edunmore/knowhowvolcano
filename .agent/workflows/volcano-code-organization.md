---
description: Volcano SDK code organization rules (Always-on)
---

# Code Organization

## Structure
```
src/volcano/
├── agents/           # Agent definitions (reusable)
│   ├── ingest-chunk.ts
│   └── extract.ts
├── sidecars/         # Pure functions (testable)
│   ├── ingest-chunk-sidecar.ts
│   └── extract-sidecar.ts
└── orchestrator.ts   # Composition only (minimal)
```

## Agent Definition

```typescript
// agents/ingest-chunk.ts
import { agent } from 'volcano-sdk';
import { ingestSource, chunkText } from '../sidecars/ingest-chunk-sidecar.js';

export function createIngestChunkAgent(sourcePath: string, vaultDir: string) {
    return agent({ name: 'IngestChunk', description: 'Ingest and chunk source' })
        .then({
            code: async () => {
                const source = await ingestSource(sourcePath);
                const chunks = await chunkText(source.content, source.id);
                return {
                    result: { sourceId: source.id, chunkCount: chunks.length },
                    message: `Completed: ${chunks.length} chunks created`
                };
            }
        });
}
```

## Sidecar Functions

```typescript
// sidecars/ingest-chunk-sidecar.ts
export async function ingestSource(path: string): Promise<Source> {
    // Pure function - no agent dependencies
    const content = await fs.readFile(path, 'utf-8');
    return { id: generateId(), content, path };
}

export async function chunkText(content: string, sourceId: string): Promise<Chunk[]> {
    // Deterministic chunking logic
    return content.split('\n\n').map((text, i) => ({
        id: `${sourceId}-chunk-${i}`,
        text,
        sourceId
    }));
}
```

## Orchestrator

```typescript
// orchestrator.ts
import { agent } from 'volcano-sdk';
import { createAzureProvider } from '../core/providers/azure-deepseek-provider.js';
import { createIngestChunkAgent } from './agents/ingest-chunk.js';
import { createExtractAgent } from './agents/extract.js';

export async function runPipeline(sourcePath: string, vaultDir: string) {
    const llm = createAzureProvider({ maxTokens: 400 });
    
    return agent({ llm, name: 'pipeline' })
        .runAgent(createIngestChunkAgent(sourcePath, vaultDir))
        .runAgent(createExtractAgent(vaultDir))
        .run();
}
```

## Benefits
- **Testable:** Sidecars are pure functions
- **Reusable:** Agents work in any workflow
- **Maintainable:** Clear separation of concerns
- **Minimal orchestrator:** 20-30 lines max
