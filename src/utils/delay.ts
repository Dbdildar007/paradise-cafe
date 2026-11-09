export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** Resolves with `fallback` if `promise` takes longer than `ms`. The timer is always cleared. */
export const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>(resolve => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
