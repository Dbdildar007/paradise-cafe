import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { DIAGNOSTIC } from '../config/featureFlags';

type Props = { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode };

const DURATION = 420;

/**
 * Staggered fade-up entrance. Content must NEVER stay invisible, so:
 *  - reduce-motion / disabled -> rendered fully visible immediately (no animation)
 *  - a hard fallback forces opacity 1 shortly after the animation should have finished
 */
export const Reveal: React.FC<Props> = ({ delay = 0, style, children }) => {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (DIAGNOSTIC.disableReveal) {
      return undefined;
    }
    let cancelled = false;
    const failSafe = setTimeout(() => value.setValue(1), delay + DURATION + 600);
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduce => {
        if (cancelled) {
          return;
        }
        if (reduce) {
          value.setValue(1);
          return;
        }
        Animated.timing(value, {
          toValue: 1,
          duration: DURATION,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // JS driver: one-time entrance, and it can never leave content stuck invisible on a native-animated node
        }).start(() => value.setValue(1));
      });
    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [delay, value]);

  if (DIAGNOSTIC.disableReveal) {
    return <View style={style}>{children}</View>;
  }
  return (
    <Animated.View
      style={[
        style,
        { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
      ]}>
      {children}
    </Animated.View>
  );
};
