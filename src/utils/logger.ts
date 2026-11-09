/**
 * The only sanctioned logging entry point. No-op in production; Babel additionally strips console.*.
 * Never log tokens, OTPs, phone numbers or any PII - even in dev.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
const emit = (level: Level, args: unknown[]) => {
  if (!__DEV__) {
    return;
  }
  // eslint-disable-next-line no-console
  console[level](`[${level}]`, ...args);
};
export const logger = {
  debug: (...a: unknown[]) => emit('debug', a),
  info: (...a: unknown[]) => emit('info', a),
  warn: (...a: unknown[]) => emit('warn', a),
  error: (...a: unknown[]) => emit('error', a),
};
