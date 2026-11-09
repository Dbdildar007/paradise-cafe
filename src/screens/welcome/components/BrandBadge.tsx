import React from 'react';
import { View } from 'react-native';
import { ClayBadge } from '../../../components/ClayBadge';
import { CrownIcon, SteamBowlIcon } from '../../../components/icons';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';

export const BADGE_SIZE = 92;

/** Clay brand medallion: cocoa bowl icon in a glass-white ring, with a gold crown pip. */
export const BrandBadge: React.FC = () => {
  const { s } = useResponsive();
  const outer = s(BADGE_SIZE);
  const inner = s(76);
  const pip = s(26);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Paradise Cafe royal emblem"
      testID="welcome-brand-badge"
      style={[
        elevation.level2,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          backgroundColor: withAlpha(colors.silk, 0.92),
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <ClayBadge size={inner} color={colors.primary}>
        <SteamBowlIcon size={s(40)} color={colors.peach} />
      </ClayBadge>
      <ClayBadge size={pip} color={colors.goldSoft} style={{ position: 'absolute', top: s(2), right: s(2) }}>
        <CrownIcon size={s(13)} color={colors.secondary} />
      </ClayBadge>
    </View>
  );
};
