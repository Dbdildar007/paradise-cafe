import React from 'react';
import { View } from 'react-native';
import { colors, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';

/** Decorative step indicator (welcome - sign in - done). */
export const PageDots: React.FC<{ active?: number; count?: number }> = ({ active = 1, count = 3 }) => {
  const { s } = useResponsive();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? s(14) : s(9),
            height: i === active ? s(14) : s(9),
            borderRadius: s(8),
            marginHorizontal: s(5),
            backgroundColor: i === active ? colors.goldDeep : withAlpha(colors.neutral, 0.22),
          }}
        />
      ))}
    </View>
  );
};
