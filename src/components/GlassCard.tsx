import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { DIAGNOSTIC } from '../config/featureFlags';
import { elevation, glass } from '../theme';

type Props = {
  radius?: number;
  tint?: string;
  blurType?: 'light' | 'dark' | 'xlight';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
};

/**
 * Refined glassmorphism (DESIGN.md Level 2): blur + translucent warm tint + razor-thin top highlight rim
 * and gold bottom rim. If the OS reduces transparency / blur is unsupported, the translucent tint
 * alone still gives a legible surface.
 */
export const GlassCard: React.FC<Props> = ({
  radius = 32,
  tint = glass.tintLight,
  blurType = 'light',
  style,
  children,
  testID,
}) => (
  <View testID={testID} style={[elevation.level2, { borderRadius: radius }, style]}>
    <View style={[styles.clip, { borderRadius: radius }]}>
      {!DIAGNOSTIC.disableBlur && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={glass.blur}
          reducedTransparencyFallbackColor={tint}
          {...(Platform.OS === 'android' ? { overlayColor: 'transparent' } : {})}
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[glass.rimTop, 'transparent', glass.rimBottom]}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius, opacity: 0.35 }]}
      />
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({ clip: { overflow: 'hidden' } });
