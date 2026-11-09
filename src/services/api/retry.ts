export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Exponential backoff: baseDelay, 2x, 4x ... */
export const withRetry = async <T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> => {
  const sleep = opts.sleep ?? defaultSleep;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= opts.retries || (opts.shouldRetry && !opts.shouldRetry(e))) {
        throw e;
      }
      await sleep(opts.baseDelayMs * 2 ** attempt);
      attempt += 1;
    }
  }
};
