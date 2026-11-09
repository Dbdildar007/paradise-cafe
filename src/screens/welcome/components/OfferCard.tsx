import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppText } from '../../../components/AppText';
import { StarCircleIcon } from '../../../components/icons';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import type { Offer } from '../welcomeContent';

type Props = { offer: Offer; width: number };

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' }) as string;

/** Claymorphic offer card: soft peach volume, raised chips, inner highlight. */
export const OfferCard: React.FC<Props> = ({ offer, width }) => {
  const { s, font } = useResponsive();
  const radius = s(30);
  return (
    <View
      testID={`offer-${offer.id}`}
      accessible
      accessibilityLabel={`${offer.tag}. ${offer.headline}. ${offer.description.replace('\n', ' ')}. Code ${offer.code}. ${offer.footnote}`}
      style={[elevation.clay, { width, borderRadius: radius, backgroundColor: colors.surfaceContainer }]}>
      <View style={[styles.clip, { borderRadius: radius, padding: s(16), minHeight: s(160) }]}>
        <LinearGradient
          pointerEvents="none"
          colors={[colors.surfaceLow, colors.surfaceContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.75)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.top}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceHigh, paddingHorizontal: s(10), paddingVertical: s(4), borderColor: withAlpha(colors.silk, 0.9) }]}>
            <AppText variant="labelMd" color={colors.goldDeep} style={{ fontSize: font(11.5), letterSpacing: font(0.3) }}>
              {offer.tag}
            </AppText>
          </View>
          {offer.showStar ? <StarCircleIcon size={s(30)} color={colors.neutral} /> : null}
        </View>

        <AppText variant="headlineLg" color={colors.tertiary} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: s(18), fontSize: font(25), fontWeight: '800' }}>
          {offer.headline}
        </AppText>
        <AppText variant="bodyMd" color={colors.neutral} style={{ marginTop: s(2), fontSize: font(13) }} numberOfLines={3}>
          {offer.description}
        </AppText>

        <View style={[styles.bottom, { marginTop: s(14) }]}>
          <View style={[styles.code, { backgroundColor: colors.surfaceHigh, paddingHorizontal: s(12), paddingVertical: s(6) }]}>
            <AppText variant="labelMd" color={colors.tertiary} style={{ fontFamily: MONO, fontSize: font(11.5), letterSpacing: font(0.6), fontWeight: '700' }}>
              {offer.code}
            </AppText>
          </View>
          <AppText variant="bodySm" color={colors.goldDeep} numberOfLines={1} style={{ fontSize: font(12), flexShrink: 1, marginLeft: s(8) }}>
            {offer.footnote}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { borderRadius: 9999, borderWidth: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { borderRadius: 9999 },
});
