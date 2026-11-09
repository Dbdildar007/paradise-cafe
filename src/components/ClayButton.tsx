import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, elevation, layout, TypographyVariant, withAlpha } from '../theme';
import { useResponsive } from '../utils/responsive';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  /** primary: cocoa clay pill - secondary: outline - soft: cream clay pill */
  variant?: 'primary' | 'secondary' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  /** Content placed before / after the label (icons, arrow badges). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  align?: 'center' | 'start';
  /** Override the primary fill (e.g. the deep cocoa used for verification CTAs). */
  fill?: string;
  labelVariant?: TypographyVariant;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * DESIGN.md buttons. Touch target >= 44dp; presses are ignored while loading/disabled.
 */
export const ClayButton: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  leading,
  trailing,
  align = 'center',
  fill,
  labelVariant = 'labelLg',
  accessibilityHint,
  style,
  testID,
}) => {
  const { s } = useResponsive();
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const soft = variant === 'soft';
  const textColor = primary ? colors.silk : soft ? colors.tertiary : colors.primary;

  const surface = primary
    ? [elevation.clay, { backgroundColor: fill ?? colors.primary, shadowColor: colors.secondary }]
    : soft
    ? [elevation.level1, { backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: withAlpha(colors.silk, 0.95) }]
    : { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: Math.max(layout.minTouch, s(layout.ctaHeight)),
          borderRadius: 9999,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        surface,
        style,
      ]}>
      <View style={[styles.inner, { justifyContent: align === 'center' ? 'center' : 'flex-start' }]}>
        {(primary || soft) && (
          <LinearGradient
            pointerEvents="none"
            colors={[primary ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.7)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]}
          />
        )}
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {leading ? <View style={{ marginRight: s(10) }}>{leading}</View> : null}
            <AppText
              variant={labelVariant}
              color={textColor}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.label, align === 'start' && styles.labelStart]}>
              {label}
            </AppText>
            {trailing ? <View style={{ marginLeft: s(10) }}>{trailing}</View> : null}
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  label: { textAlign: 'center', flexShrink: 1 },
  labelStart: { flex: 1, textAlign: 'left' },
});
