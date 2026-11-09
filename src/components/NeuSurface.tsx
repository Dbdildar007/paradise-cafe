import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, elevation, withAlpha } from '../theme';

type Props = {
  variant?: 'raised' | 'inset';
  radius?: number;
  fill?: string;
  /** inset overlay colours - override on dark surfaces */
  shade?: string;
  light?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
};

/**
 * Warm micro-neumorphism (DESIGN.md Level 3).
 *  raised: dual shadow (light top-left halo + dark bottom-right) via two stacked layers
 *  inset : recessed well, emulated with directional gradient overlays (RN lacks inset shadows)
 */
export const NeuSurface: React.FC<Props> = ({
  variant = 'raised',
  radius = 32,
  fill = colors.cream,
  shade = withAlpha(colors.neutral, 0.14),
  light = 'rgba(255,255,255,0.9)',
  style,
  children,
  testID,
}) => {
  if (variant === 'inset') {
    return (
      <View testID={testID} style={[{ borderRadius: radius, backgroundColor: fill, overflow: 'hidden' }, style]}>
        {children}
        <LinearGradient
          pointerEvents="none"
          colors={[shade, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.35, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', light]}
          start={{ x: 0.65, y: 0.65 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }
  return (
    <View testID={testID} style={[elevation.neuLight, { borderRadius: radius, backgroundColor: fill }, style]}>
      <View style={[elevation.neuDark, { borderRadius: radius, backgroundColor: fill, flexGrow: 1 }]}>{children}</View>
    </View>
  );
};
