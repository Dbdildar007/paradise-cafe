import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Platform, StyleSheet, View } from 'react-native';
import { NoInternetScreen } from '../../screens/NoInternetScreen';
import { useNetwork } from './NetworkProvider';

/**
 * Wraps the whole app. When connectivity is lost, a full-screen "No internet" layer fades over whatever
 * screen is showing (navigation state is preserved underneath) and fades away on recovery.
 */
export const NetworkGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOffline, isChecking, recheck } = useNetwork();
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  const wasOffline = useRef(false);
  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      setMounted(true);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: false }).start();
    } else if (wasOffline.current) {
      // Nothing to animate on first render while online (no orphan animated node).
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: false }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [isOffline, opacity]);

  useEffect(() => {
    if (!isOffline || Platform.OS !== 'android') {
      return undefined;
    }
    // Back while offline exits instead of silently popping screens hidden behind the overlay.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, [isOffline]);

  return (
    <View style={styles.root}>
      {children}
      {mounted && (
        <Animated.View
          testID="network-gate-overlay"
          style={[StyleSheet.absoluteFill, { opacity }]}
          accessibilityViewIsModal
          importantForAccessibility="yes">
          <NoInternetScreen onRetry={recheck} isChecking={isChecking} />
        </Animated.View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({ root: { flex: 1 } });
