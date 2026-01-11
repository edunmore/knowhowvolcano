import fs from 'node:fs/promises';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import { RunLogger } from '../run-logger.js';

interface NoteIndex {
    id: string;
    path: string;
    title: string;
    type: string;
    outboundLinks: string[];
}

export async function runIndexer(vaultDir: string, logger: RunLogger) {
    await logger.log('Starting Indexer: Building graph and indices...');

    const indexDir = join(vaultDir, '_index');
    await fs.mkdir(indexDir, { recursive: true });

    const notesMap = new Map<string, NoteIndex>();
    const backlinks = new Map<string, string[]>(); // targetID -> sourceIDs[]

    async function scan(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('_')) await scan(fullPath);
            } else if (entry.name.endsWith('.md')) {
                await processNote(fullPath);
            }
        }
    }

    async function processNote(filePath: string) {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const data = parsed.data || {};

        // Extract ID or use filename
        const id = data.id || basename(filePath, '.md');
        const title = data.title || id; // naive title extract
        const type = data.type || 'note';

        // Extract outbound links [[...]]
        const outboundLinks: string[] = [];
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const target = match[1].split('|')[0].trim();
            outboundLinks.push(target);

            // Add to backlinks
            if (!backlinks.has(target)) {
                backlinks.set(target, []);
            }
            backlinks.get(target)?.push(id);
        }

        notesMap.set(id, {
            id,
            path: relative(vaultDir, filePath),
            title,
            type,
            outboundLinks
        });
    }

    function basename(path: string, ext: string) {
        return path.split('/').pop()?.replace(ext, '') || '';
    }

    await scan(vaultDir);

    // Write _index/notes.json
    const notesArray = Array.from(notesMap.values());
    await fs.writeFile(join(indexDir, 'notes.json'), JSON.stringify(notesArray, null, 2));

    // Write _index/backlinks.json
    const backlinksObj = Object.fromEntries(backlinks);
    await fs.writeFile(join(indexDir, 'backlinks.json'), JSON.stringify(backlinksObj, null, 2));

    await logger.log(`Indexed ${notesArray.length} notes. generated backlinks.`);
}
