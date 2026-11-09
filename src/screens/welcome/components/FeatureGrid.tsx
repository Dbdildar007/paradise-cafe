import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { FEATURES } from '../welcomeContent';

/** 2x2 clay tiles that wrap to a single column on very narrow windows (< 300dp). */
export const FeatureGrid: React.FC = () => {
  const { s, font, contentWidth } = useResponsive();
  const gap = s(10);
  const narrow = contentWidth < 300;
  return (
    <View testID="welcome-features" style={[styles.grid, { gap }]}>
      {FEATURES.map(f => (
        <View
          key={f.id}
          accessible
          accessibilityLabel={`${f.title}. ${f.subtitle}`}
          style={[
            elevation.level1,
            styles.tile,
            {
              flexBasis: narrow ? '100%' : '47%',
              padding: s(12),
              borderRadius: s(16),
              backgroundColor: colors.surfaceLow,
              borderColor: withAlpha(colors.silk, 0.9),
            },
          ]}>
          <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: font(24) }}>
            {f.emoji}
          </Text>
          <View style={{ marginLeft: s(10), flex: 1 }}>
            <AppText variant="labelMd" color={colors.tertiary} numberOfLines={1} style={{ fontSize: font(12.5) }}>
              {f.title}
            </AppText>
            <AppText variant="bodyMd" color={colors.neutral} numberOfLines={2} style={{ fontSize: font(13.5), lineHeight: font(18) }}>
              {f.subtitle}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});
