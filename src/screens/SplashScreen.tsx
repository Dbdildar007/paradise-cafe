import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '../components/AppText';
import { GlassCard } from '../components/GlassCard';
import { ClocheIcon, HeartIcon } from '../components/icons';
import { NeuSurface } from '../components/NeuSurface';
import { Screen } from '../components/Screen';
import { bootstrapApp } from '../app/bootstrap';
import { SECURITY_POLICY } from '../config/security';
import { RootScreenProps } from '../navigation/types';
import { colors, elevation, withAlpha } from '../theme';
import { delay } from '../utils/delay';
import { useResponsive } from '../utils/responsive';

/** Decorative blurred "clay" spheres and dots, positioned as fractions of the window. */
const SPHERES = [
  { size: 0.46, right: -0.14, top: -0.05 },
  { size: 0.36, left: -0.2, top: 0.3 },
  { size: 0.3, right: -0.1, top: 0.58 },
] as const;
const DOTS = [
  { left: 0.77, top: 0.25, d: 7, color: colors.peachDim },
  { left: 0.24, top: 0.32, d: 5, color: colors.outlineVariant },
  { left: 0.19, top: 0.56, d: 9, color: colors.secondary },
] as const;

export const SplashScreen: React.FC<RootScreenProps<'Splash'>> = ({ navigation }) => {
  const { width, height, s, font } = useResponsive();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    Animated.timing(progress, {
      toValue: 1,
      duration: SECURITY_POLICY.minSplashMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating width
    }).start();

    Promise.all([bootstrapApp(), delay(SECURITY_POLICY.minSplashMs)]).then(([result]) => {
      if (cancelled) {
        return;
      }
      const target =
        result.status === 'blocked' ? 'SecurityBlocked' : result.hasSession ? 'Home' : 'WelcomeAsGuest';
      // reset() drops Splash from the stack completely (more robust than replace() across native-stack versions)
      navigation.reset({ index: 0, routes: [{ name: target }] });
    });
    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [navigation, progress]);

  const tile = s(88);
  const trackWidth = Math.min(width * 0.34, s(170));
  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth - s(6)] });

  const backdrop = (
      <View pointerEvents="none" style={[styles.bg, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="34%" rx="62%" ry="34%" fx="50%" fy="34%">
              <Stop offset="0" stopColor="#A5806A" stopOpacity="0.62" />
              <Stop offset="0.55" stopColor="#7A5B4A" stopOpacity="0.28" />
              <Stop offset="1" stopColor={colors.night} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#glow)" />
        </Svg>
        {SPHERES.map((p, i) => (
          <View
            key={`sphere-${i}`}
            style={[
              styles.sphere,
              {
                width: width * p.size,
                height: width * p.size,
                borderRadius: width * p.size,
                top: height * p.top,
                ...('right' in p ? { right: width * p.right } : { left: width * p.left }),
              },
            ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ))}
        {DOTS.map((d, i) => (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: width * d.left,
              top: height * d.top,
              width: s(d.d),
              height: s(d.d),
              borderRadius: s(d.d),
              backgroundColor: d.color,
              opacity: 0.9,
            }}
          />
        ))}
      </View>
  );

  return (
    <Screen testID="splash-screen" background={colors.night} dark style={styles.screen} backdrop={backdrop}>
      {/* Brand cluster */}
      <View style={styles.center}>
        <GlassCard
          testID="splash-logo"
          radius={s(26)}
          blurType="dark"
          tint="rgba(255,255,255,0.16)"
          style={{ width: tile, height: tile }}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.highlight, { top: s(9), left: s(9), right: s(9), height: s(8), borderRadius: s(4) }]}
          />
          <View style={[styles.logoDots, { top: s(25) }]}>
            {[5, 7, 5].map((d, i) => (
              <View
                key={i}
                style={{ width: s(d), height: s(d), borderRadius: s(d), backgroundColor: colors.goldSoft, marginHorizontal: s(2) }}
              />
            ))}
          </View>
          <View style={[styles.logoIcon, { top: s(42) }]}>
            <ClocheIcon size={s(36)} color={colors.peach} />
          </View>
        </GlassCard>

        <AppText
          accessibilityRole="header"
          variant="displayLg"
          color={colors.peach}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.title,
            { fontSize: font(32), lineHeight: font(40), marginTop: s(34), textShadowOffset: { width: 0, height: s(4) } },
          ]}>
          paradise cafe
        </AppText>
        <LinearGradient
          colors={['transparent', colors.secondary, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: s(48), height: 2, marginTop: s(8), borderRadius: 2 }}
        />

        {/* Pill 1 - raised clay */}
        <View style={[elevation.clay, styles.pillOuter, { marginTop: s(26), borderRadius: s(18), maxWidth: '100%' }]}>
          <View style={[styles.pillClip, { borderRadius: s(18), paddingHorizontal: s(18), paddingVertical: s(9) }]}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <AppText
              variant="labelLg"
              color={colors.goldSoft}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: font(10), letterSpacing: font(1.6), textAlign: 'center' }}>
              EST. 1984 • HYDERABADI DUM & ROASTS
            </AppText>
          </View>
        </View>

        {/* Pill 2 - recessed neumorphic well */}
        <NeuSurface
          variant="inset"
          radius={s(16)}
          fill={withAlpha('#000000', 0.16)}
          shade="rgba(0,0,0,0.25)"
          light="rgba(255,255,255,0.06)"
          style={{ marginTop: s(16), paddingHorizontal: s(24), paddingVertical: s(8), maxWidth: '100%' }}>
          <AppText
            variant="labelLg"
            color={colors.blush}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: font(10), letterSpacing: font(1.4), textAlign: 'center' }}>
            100% ROYAL ARTISANAL FEAST
          </AppText>
        </NeuSurface>
      </View>

      {/* Progress + footer */}
      <View style={[styles.footer, { paddingBottom: s(48) }]}>
        <NeuSurface
          variant="inset"
          radius={s(8)}
          fill="rgba(0,0,0,0.22)"
          shade="rgba(0,0,0,0.3)"
          light="rgba(255,255,255,0.05)"
          testID="splash-progress"
          style={{ width: trackWidth, height: s(8), justifyContent: 'center', paddingHorizontal: s(3) }}>
          <Animated.View style={{ width: fillWidth, height: s(4), borderRadius: s(2), overflow: 'hidden' }}>
            <LinearGradient colors={[colors.peach, colors.goldSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </NeuSurface>

        <View style={[styles.row, { marginTop: s(26) }]}>
          <AppText variant="labelMd" color={colors.blush} style={{ fontSize: font(10.5), letterSpacing: font(0.2) }}>
            CRAFTED WITH ROYALTY IN{' '}
          </AppText>
          <AppText variant="labelMd" color={colors.goldSoft} style={{ fontSize: font(10.5), letterSpacing: font(0.2) }}>
            BENGALURU & HYDERABAD
          </AppText>
          <View style={{ marginLeft: s(6) }}>
            <HeartIcon size={s(13)} color={colors.blush} />
          </View>
        </View>
        <AppText
          variant="labelMd"
          color={withAlpha(colors.outlineVariant, 0.55)}
          style={{ fontSize: font(11), letterSpacing: font(2), marginTop: s(8), fontWeight: '500' }}>
          A NAWABI KITCHENS ENTERPRISE
        </AppText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { alignItems: 'center' },
  bg: { position: 'absolute', top: 0, left: 0 },
  sphere: { position: 'absolute', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  highlight: { position: 'absolute' },
  logoDots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoIcon: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 10 },
  pillOuter: { backgroundColor: 'rgba(255,255,255,0.06)' },
  pillClip: { overflow: 'hidden' },
  footer: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
});
