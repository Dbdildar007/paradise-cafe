/** Pure helpers (unit-tested without timers). */
export const remainingSeconds = (targetMs: number, nowMs: number): number =>
  Math.max(0, Math.ceil((targetMs - nowMs) / 1000));

/** 62 -> "1:02", 0 -> "0:00" */
export const formatCountdown = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** 5h12m style for "try again in ..." messages. */
export const formatRetryAfter = (ms: number): string => {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
