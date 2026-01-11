#!/usr/bin/env npx tsx
/**
 * Manual index builder for benchmarks
 */

import fs from 'node:fs/promises';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const vaultDir = process.argv[2];

if (!vaultDir) {
    console.error('Usage: npx tsx scripts/build-index.ts <vault_dir>');
    process.exit(1);
}

interface NoteIndex {
    id: string;
    path: string;
    title: string;
    type: string;
    outboundLinks: string[];
}

async function main() {
    console.log(`Building index for: ${vaultDir}`);

    const indexDir = join(vaultDir, '_index');
    await fs.mkdir(indexDir, { recursive: true });

    const notesMap = new Map<string, NoteIndex>();
    const backlinks = new Map<string, string[]>();

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

        const id = data.id || basename(filePath, '.md');
        const title = data.title || id;
        const type = data.type || 'note';

        const outboundLinks: string[] = [];
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const target = match[1].split('|')[0].trim();
            outboundLinks.push(target);

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

    const notesArray = Array.from(notesMap.values());
    await fs.writeFile(join(indexDir, 'notes.json'), JSON.stringify(notesArray, null, 2));

    const backlinksObj = Object.fromEntries(backlinks);
    await fs.writeFile(join(indexDir, 'backlinks.json'), JSON.stringify(backlinksObj, null, 2));

    console.log(`✅ Indexed ${notesArray.length} notes`);

    // Show breakdown by type
    const byType: Record<string, number> = {};
    for (const note of notesArray) {
        byType[note.type] = (byType[note.type] || 0) + 1;
    }
    console.log(`   Types:`, byType);
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
