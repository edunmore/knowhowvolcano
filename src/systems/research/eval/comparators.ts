/**
 * Comparison result from any comparator
 */
export interface ComparisonResult {
    pass: boolean;
    score: number;
    method: string;
    details: Record<string, any>;
    errors: string[];
}

/**
 * Exact JSON match comparison
 */
export function exactJsonMatch(actual: any, expected: any): ComparisonResult {
    const result: ComparisonResult = {
        pass: false,
        score: 0,
        method: 'exact_json',
        details: {},
        errors: [],
    };

    try {
        const actualStr = JSON.stringify(actual, Object.keys(actual).sort());
        const expectedStr = JSON.stringify(expected, Object.keys(expected).sort());

        result.pass = actualStr === expectedStr;
        result.score = result.pass ? 1.0 : 0.0;
        result.details = {
            actualKeys: Object.keys(actual),
            expectedKeys: Object.keys(expected),
        };
    } catch (error: any) {
        result.errors.push(`Comparison error: ${error.message}`);
    }

    return result;
}

/**
 * Set overlap (Jaccard) comparison for arrays of objects with name/type
 */
export function setOverlap(
    actual: Array<{ name: string; type: string }>,
    expected: Array<{ name: string; type: string }>
): ComparisonResult {
    const result: ComparisonResult = {
        pass: false,
        score: 0,
        method: 'set_overlap',
        details: {},
        errors: [],
    };

    try {
        // Normalize to lowercase for comparison
        const actualSet = new Set(actual.map(a => `${a.type}:${a.name.toLowerCase()}`));
        const expectedSet = new Set(expected.map(e => `${e.type}:${e.name.toLowerCase()}`));

        // Calculate intersection
        const intersection = new Set([...actualSet].filter(x => expectedSet.has(x)));

        // Calculate union
        const union = new Set([...actualSet, ...expectedSet]);

        // Jaccard similarity
        const jaccard = union.size > 0 ? intersection.size / union.size : 0;

        // Precision and recall
        const precision = actualSet.size > 0 ? intersection.size / actualSet.size : 0;
        const recall = expectedSet.size > 0 ? intersection.size / expectedSet.size : 0;
        const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

        // Find missing and extra
        const missing = [...expectedSet].filter(x => !actualSet.has(x));
        const extra = [...actualSet].filter(x => !expectedSet.has(x));

        result.score = jaccard;
        result.pass = jaccard >= 0.8; // Default threshold
        result.details = {
            jaccard,
            precision,
            recall,
            f1,
            intersection_size: intersection.size,
            actual_size: actualSet.size,
            expected_size: expectedSet.size,
            missing,
            extra,
        };
    } catch (error: any) {
        result.errors.push(`Comparison error: ${error.message}`);
    }

    return result;
}

/**
 * Markdown structure comparison (checks for required sections and YAML validity)
 */
export function markdownStructure(
    actual: string,
    expected: { required_sections: string[]; require_yaml: boolean }
): ComparisonResult {
    const result: ComparisonResult = {
        pass: false,
        score: 0,
        method: 'markdown_structure',
        details: {},
        errors: [],
    };

    try {
        const issues: string[] = [];
        let sectionScore = 0;

        // Check YAML frontmatter
        if (expected.require_yaml) {
            const yamlMatch = actual.match(/^---\n([\s\S]*?)\n---/);
            if (!yamlMatch) {
                issues.push('Missing YAML frontmatter');
            } else {
                // Basic YAML validation (check for key: value pattern)
                const yamlContent = yamlMatch[1];
                const hasValidYaml = /^\w+:\s*.+$/m.test(yamlContent);
                if (!hasValidYaml) {
                    issues.push('Invalid YAML frontmatter structure');
                }
            }
        }

        // Check required sections
        const foundSections: string[] = [];
        const missingSections: string[] = [];

        for (const section of expected.required_sections) {
            // Look for ## Section or # Section patterns
            const sectionPattern = new RegExp(`^##?\\s+${section}`, 'im');
            if (sectionPattern.test(actual)) {
                foundSections.push(section);
                sectionScore++;
            } else {
                missingSections.push(section);
            }
        }

        // Calculate score
        const totalChecks = expected.required_sections.length + (expected.require_yaml ? 1 : 0);
        const passedChecks = sectionScore + (expected.require_yaml && !issues.some(i => i.includes('YAML')) ? 1 : 0);
        result.score = totalChecks > 0 ? passedChecks / totalChecks : 1;
        result.pass = issues.length === 0 && missingSections.length === 0;

        result.details = {
            found_sections: foundSections,
            missing_sections: missingSections,
            yaml_valid: expected.require_yaml ? !issues.some(i => i.includes('YAML')) : true,
            issues,
        };
    } catch (error: any) {
        result.errors.push(`Comparison error: ${error.message}`);
    }

    return result;
}

/**
 * Schema JSON validation (checks structure matches schema)
 */
export function schemaJson(
    actual: any,
    requiredFields: string[]
): ComparisonResult {
    const result: ComparisonResult = {
        pass: false,
        score: 0,
        method: 'schema_json',
        details: {},
        errors: [],
    };

    try {
        const missingFields: string[] = [];
        const foundFields: string[] = [];

        for (const field of requiredFields) {
            if (actual[field] !== undefined) {
                foundFields.push(field);
            } else {
                missingFields.push(field);
            }
        }

        result.score = requiredFields.length > 0
            ? foundFields.length / requiredFields.length
            : 1;
        result.pass = missingFields.length === 0;
        result.details = {
            found_fields: foundFields,
            missing_fields: missingFields,
        };
    } catch (error: any) {
        result.errors.push(`Comparison error: ${error.message}`);
    }

    return result;
}

/**
 * Hybrid comparison that combines multiple methods
 */
export function hybridCompare(
    actual: any,
    expected: any,
    config: {
        jsonFields?: string[];
        setOverlapKey?: string;
        structureCheck?: { required_sections: string[]; require_yaml: boolean };
        thresholds?: { json?: number; overlap?: number; structure?: number };
    }
): ComparisonResult {
    const results: ComparisonResult[] = [];
    const thresholds = config.thresholds || { json: 1.0, overlap: 0.8, structure: 1.0 };

    // JSON field check
    if (config.jsonFields && config.jsonFields.length > 0) {
        results.push(schemaJson(actual, config.jsonFields));
    }

    // Set overlap check
    if (config.setOverlapKey && actual[config.setOverlapKey] && expected[config.setOverlapKey]) {
        results.push(setOverlap(actual[config.setOverlapKey], expected[config.setOverlapKey]));
    }

    // Structure check (for string content)
    if (config.structureCheck && typeof actual === 'string') {
        results.push(markdownStructure(actual, config.structureCheck));
    }

    // Aggregate
    const avgScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 1;
    const allPass = results.every(r => r.pass);

    return {
        pass: allPass,
        score: avgScore,
        method: 'hybrid',
        details: {
            sub_results: results.map(r => ({ method: r.method, pass: r.pass, score: r.score })),
        },
        errors: results.flatMap(r => r.errors),
    };
}
