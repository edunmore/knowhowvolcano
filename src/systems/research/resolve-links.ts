#!/usr/bin/env node
/**
 * Link Resolution CLI
 * 
 * Resolves [[wikilinks]] in vault notes and creates stubs for missing links.
 */

import { resolveLinks, updateStubsIndex } from './link-resolver.js';

async function main() {
    const vaultPath = process.argv[2];

    if (!vaultPath) {
        console.error('Usage: npx tsx src/systems/research/resolve-links.ts <vault-path>');
        process.exit(1);
    }

    console.log('🔗 Link Resolver');
    console.log(`   Vault: ${vaultPath}\n`);

    try {
        const result = await resolveLinks(vaultPath);

        console.log(`\n📊 Resolution Summary:`);
        console.log(`   Resolved links: ${result.resolved.length}`);
        console.log(`   Unresolved links: ${result.unresolved.length}`);
        console.log(`   Stubs created: ${result.stubsCreated.length}`);

        if (result.stubsCreated.length > 0) {
            await updateStubsIndex(vaultPath, result.stubsCreated);
            console.log(`\n✅ Created ${result.stubsCreated.length} stub files:`);
            for (const stub of result.stubsCreated) {
                console.log(`   - ${stub}`);
            }
        }

        if (result.unresolved.length > 0) {
            console.log(`\n⚠️  Unresolved links (no stubs created due to stub_policy=ignore):`);
            const uniqueUnresolved = new Set(result.unresolved.map(l => l.targetTitle));
            for (const title of uniqueUnresolved) {
                console.log(`   - ${title}`);
            }
        }

    } catch (error) {
        console.error('Error resolving links:', error);
        process.exit(1);
    }
}

main();
