import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { ClayBadge } from '../../../components/ClayBadge';
import { StarOutlineIcon } from '../../../components/icons';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { PATRON_AVATARS, WELCOME_COPY } from '../welcomeContent';

const TONES = { primary: colors.primary, secondary: colors.secondary, peachDim: colors.peachDim } as const;

/** Social-proof pill: stacked avatars + rating. */
export const PatronsPill: React.FC = () => {
  const { s, font } = useResponsive();
  const size = s(30);
  return (
    <View
      accessible
      accessibilityLabel={`Rated ${WELCOME_COPY.rating} by 42 thousand plus royal patrons`}
      testID="welcome-patrons"
      style={[
        elevation.level1,
        styles.pill,
        {
          paddingVertical: s(8),
          paddingHorizontal: s(14),
          backgroundColor: colors.surfaceLow,
          borderColor: withAlpha(colors.silk, 0.95),
        },
      ]}>
      <View style={styles.avatars}>
        {PATRON_AVATARS.map((a, i) => (
          <ClayBadge key={a.id} size={size} color={TONES[a.tone]} style={{ marginLeft: i === 0 ? 0 : -s(10), borderWidth: 2, borderColor: colors.surfaceLow }}>
            <AppText variant="labelSm" color={colors.silk} style={{ fontSize: font(11) }}>
              {a.initial}
            </AppText>
          </ClayBadge>
        ))}
      </View>
      <View style={{ marginLeft: s(12) }}>
        <StarOutlineIcon size={s(16)} color={colors.tertiary} />
      </View>
      <AppText variant="labelLg" color={colors.tertiary} style={{ marginLeft: s(6), fontSize: font(14) }}>
        {WELCOME_COPY.rating}
      </AppText>
      <AppText variant="bodyMd" color={colors.neutral} style={{ marginLeft: s(4), fontSize: font(14) }}>
        {WELCOME_COPY.patrons}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: 9999, borderWidth: 1, alignSelf: 'center' },
  avatars: { flexDirection: 'row', alignItems: 'center' },
});
