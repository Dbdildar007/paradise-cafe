import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkContextValue = {
  isOffline: boolean;
  isChecking: boolean;
  recheck: () => Promise<boolean>;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOffline: false,
  isChecking: false,
  recheck: async () => true,
});

const OFFLINE_DEBOUNCE_MS = 800; // ignore flaps during cell <-> wifi handover

export const isStateOffline = (s: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean =>
  s.isConnected === false || s.isInternetReachable === false;

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setOffline] = useState(false);
  const [isChecking, setChecking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (isStateOffline(state)) {
        timer.current = setTimeout(() => setOffline(true), OFFLINE_DEBOUNCE_MS);
      } else {
        setOffline(false); // recover immediately
      }
    });
    return () => {
      unsubscribe();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      const state = await NetInfo.refresh();
      const offline = isStateOffline(state);
      setOffline(offline);
      return !offline;
    } finally {
      setChecking(false);
    }
  }, []);

  const value = useMemo(() => ({ isOffline, isChecking, recheck }), [isOffline, isChecking, recheck]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => useContext(NetworkContext);
