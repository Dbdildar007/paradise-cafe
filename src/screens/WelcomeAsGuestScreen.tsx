import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Reveal } from '../components/Reveal';
import { RootScreenProps } from '../navigation/types';
import { useGuardedNavigate } from '../navigation/useGuardedNavigate';
import { colors, layout, withAlpha } from '../theme';
import { useResponsive } from '../utils/responsive';
import { BADGE_SIZE, BrandBadge } from './welcome/components/BrandBadge';
import { FeatureGrid } from './welcome/components/FeatureGrid';
import { HeroBackdrop } from './welcome/components/HeroBackdrop';
import { OfferCarousel } from './welcome/components/OfferCarousel';
import { PatronsPill } from './welcome/components/PatronsPill';
import { TOPBAR_HEIGHT, TopBar } from './welcome/components/TopBar';
import { WelcomeActions } from './welcome/components/WelcomeActions';
import { WELCOME_COPY } from './welcome/welcomeContent';

/**
 * welcome_as_guest - first screen for signed-out users.
 * Navigation map:  Skip -> Home (replace) | Explore Menu & Order -> MenuAndOrder | Sign In with Mobile -> MobileOtpAccess
 *                  Continue as Guest & Browse Locations -> BrowseLocations
 */
export const WelcomeAsGuestScreen: React.FC<RootScreenProps<'WelcomeAsGuest'>> = ({ navigation }) => {
  const { width, height, s, font, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const go = useGuardedNavigate();

  const onSkip = useCallback(() => go(() => navigation.replace('Home')), [go, navigation]);
  const onExplore = useCallback(() => go(() => navigation.navigate('MenuAndOrder')), [go, navigation]);
  const onSignIn = useCallback(() => go(() => navigation.navigate('MobileOtpAccess')), [go, navigation]);
  const onGuest = useCallback(() => go(() => navigation.navigate('BrowseLocations')), [go, navigation]);

  // Hero occupies ~30% of the window (clamped so tablets / landscape stay balanced); the brand badge straddles its edge.
  const heroHeight = Math.round(Math.min(Math.max(height * 0.3, s(210)), s(340)));
  const badge = s(BADGE_SIZE);
  const topBlock = insets.top + s(12) + s(TOPBAR_HEIGHT);
  const spacer = Math.max(s(24), heroHeight - topBlock - badge / 2);

  return (
    <View testID="screen-welcome-as-guest" style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <HeroBackdrop width={width} height={heroHeight + s(40)} />

      <ScrollView
        testID="welcome-scroll"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + s(28) }}>
        <View style={{ width: contentWidth, paddingHorizontal: layout.margin }}>
          <View style={{ paddingTop: insets.top + s(12) }}>
            <TopBar onSkip={onSkip} />
          </View>

          <View style={{ height: spacer }} />

          <Reveal style={styles.center}>
            <BrandBadge />
            <View style={[styles.eyebrowRow, { marginTop: s(22) }]}>
              <View style={[styles.rule, { width: s(34), backgroundColor: withAlpha(colors.secondary, 0.7) }]} />
              <AppText variant="labelMd" color={colors.goldDeep} style={{ fontSize: font(12.5), letterSpacing: font(1.4), marginHorizontal: s(12) }}>
                {WELCOME_COPY.eyebrow}
              </AppText>
              <View style={[styles.rule, { width: s(34), backgroundColor: withAlpha(colors.secondary, 0.7) }]} />
            </View>
            <AppText
              accessibilityRole="header"
              variant="displayLg"
              color={colors.tertiary}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ marginTop: s(6), fontSize: font(36), lineHeight: font(44), fontWeight: '800', textAlign: 'center', letterSpacing: -font(1.2) }}>
              {WELCOME_COPY.title}
            </AppText>
            <AppText variant="bodyLg" color={colors.neutral} style={{ marginTop: s(8), textAlign: 'center', maxWidth: s(330), fontSize: font(16), lineHeight: font(28) }}>
              {WELCOME_COPY.subtitle}
            </AppText>
          </Reveal>

          <Reveal delay={90} style={{ marginTop: s(20) }}>
            <PatronsPill />
          </Reveal>

          <Reveal delay={160} style={{ marginTop: s(26) }}>
            <OfferCarousel />
          </Reveal>

          <Reveal delay={230} style={{ marginTop: s(4) }}>
            <FeatureGrid />
          </Reveal>

          <Reveal delay={300} style={{ marginTop: s(26) }}>
            <WelcomeActions onExplore={onExplore} onSignIn={onSignIn} onGuest={onGuest} />
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rule: { height: 1.5 },
});
