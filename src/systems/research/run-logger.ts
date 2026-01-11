import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { RunContext } from './types.js';

export class RunLogger {
    private verbose: boolean;
    private runId: string;
    private runsDir: string;
    private logFile: string;

    constructor(runsDir: string, runId: string, verbose: boolean = false) {
        this.runsDir = runsDir;
        this.runId = runId;
        this.verbose = verbose;
        this.logFile = join(runsDir, runId, 'run.log');
    }

    static async create(runsDir: string, verbose: boolean = false): Promise<RunLogger> {
        const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        const runDir = join(runsDir, runId);
        await fs.mkdir(runDir, { recursive: true });
        return new RunLogger(runsDir, runId, verbose);
    }

    getRunId(): string {
        return this.runId;
    }

    getRunDir(): string {
        return join(this.runsDir, this.runId);
    }

    async log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO') {
        if (level === 'DEBUG' && !this.verbose) {
            return;
        }

        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [${level}] ${message}\n`;

        console.log(line.trim());
        await fs.appendFile(this.logFile, line);
    }

    async debug(message: string) {
        return this.log(message, 'DEBUG');
    }

    async saveManifest(context: RunContext) {
        const manifestPath = join(this.runsDir, this.runId, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(context, null, 2));
    }
}
