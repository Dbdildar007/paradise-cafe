import { useEffect, useState } from 'react';
import { remainingSeconds } from './countdown';

/** Ticks once a second until `targetMs`. Timestamp-based, so it stays correct after backgrounding. */
export const useCountdown = (targetMs: number, now: () => number = Date.now): number => {
  const [seconds, setSeconds] = useState(() => remainingSeconds(targetMs, now()));

  useEffect(() => {
    setSeconds(remainingSeconds(targetMs, now()));
    if (targetMs <= now()) {
      return undefined;
    }
    const id = setInterval(() => {
      const left = remainingSeconds(targetMs, now());
      setSeconds(left);
      if (left <= 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs, now]);

  return seconds;
};
