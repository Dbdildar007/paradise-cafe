import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, elevation } from '../theme';

type Props = {
  size?: number;
  color?: string;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Soft claymorphism (DESIGN.md Level 4): outer shadow + inner top highlight + inner bottom shade. */
export const ClayBadge: React.FC<Props> = ({ size = 40, color = colors.primary, rounded = true, style, children }) => {
  const r = rounded ? size / 2 : size * 0.32;
  return (
    <View style={[elevation.clay, { width: size, height: size, borderRadius: r, backgroundColor: color }, style]}>
      <View style={[styles.clip, { borderRadius: r }]}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.45 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(73,50,37,0.18)']}
          start={{ x: 0.5, y: 0.6 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>{children}</View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
