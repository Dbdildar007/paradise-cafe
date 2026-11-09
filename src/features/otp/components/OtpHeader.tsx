import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AppText } from '../../../components/AppText';
import { FlowerIcon, HeritageGlyphIcon, MedallionIcon } from '../../../components/icons';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' }) as string;

/** Brand header: heritage pill, glowing clay medallion, wordmark, italic tagline and flower divider. */
export const OtpHeader: React.FC = () => {
  const { s, font } = useResponsive();
  const ring = s(112);
  const glow = s(250);
  return (
    <View style={styles.center}>
      <View
        style={[
          elevation.level1,
          styles.pill,
          { paddingHorizontal: s(16), paddingVertical: s(9), borderRadius: 9999, backgroundColor: withAlpha(colors.silk, 0.55), borderColor: withAlpha(colors.silk, 0.9) },
        ]}>
        <HeritageGlyphIcon size={s(11)} color={colors.goldDeep} />
        <AppText variant="labelMd" color={colors.goldDeep} style={{ marginLeft: s(8), fontSize: font(12.5), letterSpacing: font(1.8) }}>
          HERITAGE GASTRONOMY
        </AppText>
      </View>

      <View style={{ marginTop: s(26), width: glow, height: ring, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={glow} height={glow} style={{ position: 'absolute' }} pointerEvents="none">
          <Defs>
            <RadialGradient id="otpGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={colors.secondaryContainer} stopOpacity="0.85" />
              <Stop offset="0.55" stopColor={colors.secondaryContainer} stopOpacity="0.3" />
              <Stop offset="1" stopColor={colors.secondaryContainer} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#otpGlow)" />
        </Svg>
        <View
          testID="otp-medallion"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Paradise Cafe emblem"
          style={[
            elevation.level2,
            { width: ring, height: ring, borderRadius: ring / 2, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: withAlpha(colors.silk, 0.95) },
          ]}>
          <MedallionIcon size={s(70)} disc={colors.primary} cream={colors.surfaceLow} gold={colors.secondary} />
        </View>
      </View>

      <AppText
        accessibilityRole="header"
        variant="displayLg"
        color={colors.primary}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ marginTop: s(18), fontSize: font(34), lineHeight: font(42), fontWeight: '700', letterSpacing: font(0.6), textAlign: 'center' }}>
        PARADISE CAFE
      </AppText>
      <AppText
        variant="bodyLg"
        color={colors.goldDeep}
        style={{ marginTop: s(6), fontFamily: SERIF, fontStyle: 'italic', fontSize: font(17), letterSpacing: font(1.2), textAlign: 'center' }}>
        Pure Taste. Modern Heritage.
      </AppText>

      <View style={[styles.divider, { marginTop: s(16) }]}>
        <LinearGradient colors={['transparent', withAlpha(colors.secondary, 0.7)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: s(64), height: 1.5 }} />
        <View style={{ marginHorizontal: s(12) }}>
          <FlowerIcon size={s(22)} color={colors.secondary} />
        </View>
        <LinearGradient colors={[withAlpha(colors.secondary, 0.7), 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: s(64), height: 1.5 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  divider: { flexDirection: 'row', alignItems: 'center' },
});
