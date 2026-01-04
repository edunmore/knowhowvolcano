export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function getArtifactId(name: string, type: string): string {
    return `${type}-${slugify(name)}`;
}

export function getArtifactFilename(name: string, type: string): string {
    return `${getArtifactId(name, type)}.md`;
}
