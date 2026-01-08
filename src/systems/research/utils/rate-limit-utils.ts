/**
 * Rate Limit Utilities - Retry with exponential backoff for 429 errors
 * 
 * Wraps async functions to automatically retry on rate limit errors.
 */

export interface RateLimitConfig {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

const DEFAULT_CONFIG: Required<Omit<RateLimitConfig, 'onRetry'>> = {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
};

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: any): boolean {
    if (!error) return false;

    // Check for 429 status code
    if (error.status === 429) return true;
    if (error.statusCode === 429) return true;

    // Check error message for rate limit indicators
    const message = error.message?.toLowerCase() || '';
    if (message.includes('429')) return true;
    if (message.includes('rate limit')) return true;
    if (message.includes('too many requests')) return true;

    return false;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with rate limit retry logic
 * 
 * @param fn - Async function to wrap
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries exhausted
 */
export async function withRateLimitRetry<T>(
    fn: () => Promise<T>,
    config: RateLimitConfig = {}
): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_CONFIG, ...config };
    const { onRetry } = config;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Only retry on rate limit errors
            if (!isRateLimitError(error)) {
                throw error;
            }

            // Don't retry if we've exhausted attempts
            if (attempt >= maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delayMs = Math.min(
                baseDelayMs * Math.pow(2, attempt),
                maxDelayMs
            );

            // Notify about retry
            if (onRetry) {
                onRetry(attempt + 1, delayMs, error);
            }

            // Wait before retry
            await sleep(delayMs);
        }
    }

    throw lastError;
}

/**
 * Create a rate-limit-aware wrapper for agent functions
 * Includes logging of retries
 */
export function createRateLimitedAgent<TArgs extends any[], TResult>(
    agentFn: (...args: TArgs) => Promise<TResult>,
    agentName: string,
    logger?: { log: (msg: string, level?: string) => Promise<void> }
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        return withRateLimitRetry(
            () => agentFn(...args),
            {
                maxRetries: 3,
                baseDelayMs: 2000,
                onRetry: async (attempt, delayMs, error) => {
                    const msg = `[RateLimit] ${agentName} hit rate limit, waiting ${delayMs}ms before retry ${attempt}/3`;
                    if (logger) {
                        await logger.log(msg, 'WARN');
                    } else {
                        console.log(msg);
                    }
                }
            }
        );
    };
}
