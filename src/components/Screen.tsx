import React from 'react';
import { StatusBar, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '../theme';
import { useResponsive } from '../utils/responsive';

type Props = {
  children: React.ReactNode;
  background?: string;
  dark?: boolean;
  /** Full-bleed decoration rendered behind the (max-width constrained) content. */
  backdrop?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Safe-area aware, max-width constrained (tablet/foldable) screen container. */
export const Screen: React.FC<Props> = ({ children, background = colors.canvas, dark = false, backdrop, style, testID }) => {
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: background }]}>
      {backdrop}
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View
        style={[
          styles.content,
          {
            width: contentWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingHorizontal: layout.margin,
          },
          style,
        ]}>
        {children}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  content: { flex: 1 },
});
