import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Screen } from '../components/Screen';
import { colors } from '../theme';

type Props = {
  name: string;
  testID: string;
  /** Dev-only affordance to exercise navigation transitions. Never rendered in release builds. */
  devNext?: { label: string; onPress: () => void };
};

/** Page stub: prints ONLY the page name (release). Replace with the real screen later. */
export const PlaceholderScreen: React.FC<Props> = ({ name, testID, devNext }) => (
  <Screen testID={testID}>
    <View style={styles.center}>
      <AppText variant="headlineLg" color={colors.tertiary} accessibilityRole="header">
        {name}
      </AppText>
      {__DEV__ && devNext ? (
        <Pressable testID="dev-next" accessibilityRole="button" onPress={devNext.onPress} style={styles.dev}>
          <AppText variant="labelMd" color={colors.primary}>
            {devNext.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  </Screen>
);
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dev: { marginTop: 24, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999, backgroundColor: colors.cream },
});
