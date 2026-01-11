export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Get artifact ID WITHOUT type prefix
 * e.g., "Friction Budget" → "friction-budget"
 */
export function getArtifactId(name: string, _type?: string): string {
    // Type is ignored - we no longer embed type in the ID
    return slugify(name);
}

/**
 * Get artifact filename WITHOUT type prefix
 * e.g., "Friction Budget" → "friction-budget.md"
 * 
 * Note: Type is still used for folder organization, but NOT in filename
 */
export function getArtifactFilename(name: string, _type?: string): string {
    return `${getArtifactId(name)}.md`;
}

/**
 * Get artifact ID WITH type prefix (legacy/backwards compat)
 * e.g., "Friction Budget", "concept" → "concept-friction-budget"
 */
export function getArtifactIdWithType(name: string, type: string): string {
    return `${type}-${slugify(name)}`;
}
