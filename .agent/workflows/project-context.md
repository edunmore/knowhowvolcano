---
description: Project context and key rules for the Canon Extraction Pipeline
---

# Canon Extraction Pipeline

## Project Overview
Research-grade knowledge extraction system using Volcano SDK for multi-agent workflows. Processes documents through: ingest → chunk → extract → model → verify.

## Tech Stack
- **Volcano SDK**: Agent composition and multi-LLM workflows
- **LLM Providers**: Azure DeepSeek (fast), GPT-5-nano (simple, less expensive, can be tricky, for low level tasks)
- **Storage**: Vault-based file system for artifacts

## Key Volcano Patterns

### Code Steps (Custom Feature)
```typescript
.then({ code: async () => ({
    result: { data },
    message: 'Completed: X items'  // Coordinator visibility
}) })
```

### Multi-Agent Crews
- Agent `name` MUST match task in prompt
- Use `{result, message}` for coordinator visibility
- Clean prompts - no redundant USE/DONE instructions

### File Organization
```
src/volcanosix/
├── agents/      # Agent definitions
├── sidecars/    # Pure functions
└── orchestrator.ts
```

## Workflow References
- `/volcano-agents` - Complete SDK patterns
- `/volcano-providers` - LLM setup
- `/volcano-code-organization` - Structure rules
- `/volcano-custom-providers` - Embeddings, search

## Current Status
- ✅ Code step feature (custom SDK modification)
- ✅ Multi-agent crew patterns validated
- ✅ Loop-until-completion tested
- ✅ DeepSeek + GPT-5-nano working
- [ ] Migrate research pipeline agents
