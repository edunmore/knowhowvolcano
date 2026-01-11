import type { LLMHandle } from 'volcano-sdk';

export interface ResearchConfig {
    sourceDir: string;
    vaultDir: string;
    runsDir: string;
    provider?: 'azure-gpt52' | 'gemini' | 'deepseek' | 'ollama';
    startFile?: string;
    verbose?: boolean;
}

export interface RunContext {
    runId: string;
    timestamp: string;
    config: ResearchConfig;
    manifest: {
        filesRead: string[];
        notesCreated: string[];
        stepsCompleted: string[];
    };
}
