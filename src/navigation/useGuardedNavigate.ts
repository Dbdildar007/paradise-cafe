import { useCallback, useRef } from 'react';

/**
 * Prevents double navigation from rapid taps (the classic duplicate-push bug).
 * Wrap every navigation call:  const go = useGuardedNavigate();  onPress={() => go(() => navigation.navigate('X'))}
 */
export const useGuardedNavigate = (windowMs = 700) => {
  const last = useRef(0);
  return useCallback(
    (action: () => void) => {
      const now = Date.now();
      if (now - last.current < windowMs) {
        return;
      }
      last.current = now;
      action();
    },
    [windowMs],
  );
};
