import React, { useEffect } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { GlassCard } from '../../../components/GlassCard';
import { colors, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';

type Props = { visible: boolean; message: string };

/**
 * Full-screen scrim + glass spinner card. While visible it swallows every touch and the Android back button,
 * so nothing can be tapped during "Sending OTP" / "Verifying".
 */
export const BlockingLoader: React.FC<Props> = ({ visible, message }) => {
  const { s } = useResponsive();

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  if (!visible) {
    return null;
  }
  return (
    <Pressable
      testID="blocking-loader"
      style={[StyleSheet.absoluteFill, styles.scrim, { backgroundColor: withAlpha(colors.onSurface, 0.28) }]}
      accessible
      accessibilityViewIsModal
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      onPress={() => undefined} // capture taps
    >
      <GlassCard radius={s(28)} tint="rgba(255,255,255,0.86)">
        <View style={[styles.card, { paddingVertical: s(22), paddingHorizontal: s(30) }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="labelLg" color={colors.tertiary} style={{ marginTop: s(12) }}>
            {message}
          </AppText>
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  scrim: { alignItems: 'center', justifyContent: 'center', zIndex: 50, elevation: 50 },
  card: { alignItems: 'center', minWidth: 170 },
});
