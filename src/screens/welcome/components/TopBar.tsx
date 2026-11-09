import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { GlassCard } from '../../../components/GlassCard';
import { ArrowRightIcon, SparkleIcon } from '../../../components/icons';
import { colors, glass } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { WELCOME_COPY } from '../welcomeContent';

type Props = { onSkip: () => void };

export const TOPBAR_HEIGHT = 40;

/** Floating glass pills over the hero: brand tagline (left) and Skip (right). */
export const TopBar: React.FC<Props> = ({ onSkip }) => {
  const { s, font } = useResponsive();
  const h = s(TOPBAR_HEIGHT);
  return (
    <View style={styles.row}>
      <GlassCard radius={h} blurType="dark" tint={glass.tintSmoke} style={styles.badge}>
        <View style={[styles.pill, { height: h, paddingHorizontal: s(14) }]}>
          <SparkleIcon size={s(13)} color={colors.goldSoft} />
          <AppText
            variant="labelMd"
            color={colors.silk}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ marginLeft: s(8), flexShrink: 1, fontSize: font(11.5), letterSpacing: font(0.6) }}>
            {WELCOME_COPY.badge}
          </AppText>
        </View>
      </GlassCard>

      <Pressable
        testID="welcome-skip"
        accessibilityRole="button"
        accessibilityLabel="Skip"
        accessibilityHint="Go to the home screen as a guest"
        hitSlop={8}
        onPress={onSkip}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }], marginLeft: s(10) })}>
        <GlassCard radius={h} blurType="dark" tint={glass.tintSmoke}>
          <View style={[styles.pill, { height: h, paddingHorizontal: s(16) }]}>
            <AppText variant="labelLg" color={colors.silk} style={{ fontSize: font(14) }}>
              {WELCOME_COPY.skip}
            </AppText>
            <View style={{ marginLeft: s(6) }}>
              <ArrowRightIcon size={s(16)} color={colors.silk} />
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center' },
});
