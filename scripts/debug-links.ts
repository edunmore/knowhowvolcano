#!/usr/bin/env npx tsx
/**
 * Debug link parsing - step by step
 */

import fs from 'fs';

const content = fs.readFileSync('./benchmark/full-pipeline-2026-01-07-1338/concepts/concept-outcome-ladder.md', 'utf-8');

console.log('Content length:', content.length);

// Step 1: Find LINK_INTENTS section
const sectionStart = content.indexOf('## LINK_INTENTS');
console.log('\n1. Section start:', sectionStart);
if (sectionStart === -1) {
    console.log('   FAIL: No LINK_INTENTS section found');
    process.exit(1);
}

// Step 2: Get content after section
const afterSection = content.slice(sectionStart);
console.log('2. After section length:', afterSection.length);
console.log('   First 50 chars:', afterSection.slice(0, 50).replace(/\n/g, '\\n'));

// Step 3: Find code block start
const codeStart = afterSection.indexOf('```json');
console.log('3. Code start:', codeStart);
if (codeStart === -1) {
    console.log('   FAIL: No ```json found');
    process.exit(1);
}

// Step 4: Find newline after ```json
const jsonStart = afterSection.indexOf('\n', codeStart) + 1;
console.log('4. JSON start:', jsonStart);

// Step 5: Find code block end
const codeEnd = afterSection.indexOf('```', jsonStart);
console.log('5. Code end:', codeEnd);

// Step 6: Extract JSON
const jsonContent = afterSection.slice(jsonStart, codeEnd).trim();
console.log('6. JSON content length:', jsonContent.length);
console.log('   First 100 chars:', jsonContent.slice(0, 100));

// Step 7: Parse JSON
try {
    const parsed = JSON.parse(jsonContent);
    console.log('7. Parsed OK! link_intents:', parsed.link_intents?.length || 0);
    for (const i of parsed.link_intents || []) {
        console.log(`   - ${i.target_title}: ${i.stub_policy}`);
    }
} catch (e: any) {
    console.log('7. JSON parse error:', e.message);
}
