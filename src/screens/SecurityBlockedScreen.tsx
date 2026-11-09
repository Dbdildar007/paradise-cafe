import React from 'react';
import { BackHandler, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ClayBadge } from '../components/ClayBadge';
import { ClayButton } from '../components/ClayButton';
import { ShieldIcon } from '../components/icons';
import { NeuSurface } from '../components/NeuSurface';
import { Screen } from '../components/Screen';
import { colors } from '../theme';
import { useResponsive } from '../utils/responsive';

/** Shown when root/jailbreak/hook/debugger is detected in a release build. Terminal screen - no navigation out. */
export const SecurityBlockedScreen: React.FC = () => {
  const { s } = useResponsive();
  return (
    <Screen testID="security-blocked-screen">
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <NeuSurface radius={s(150)} style={{ width: s(150), height: s(150), alignItems: 'center', justifyContent: 'center' }}>
          <ClayBadge size={s(88)} color={colors.error}>
            <ShieldIcon size={s(46)} color={colors.silk} />
          </ClayBadge>
        </NeuSurface>
        <AppText accessibilityRole="header" variant="headlineLg" color={colors.tertiary} style={{ marginTop: s(28), textAlign: 'center' }}>
          This device is not supported
        </AppText>
        <AppText variant="bodyLg" style={{ marginTop: s(8), textAlign: 'center', maxWidth: s(320) }}>
          To protect your account and payments, Paradise Cafe cannot run on rooted, jailbroken or modified devices.
        </AppText>
        {Platform.OS === 'android' && (
          <View style={{ alignSelf: 'stretch', marginTop: s(28) }}>
            <ClayButton testID="close-app-button" label="Close app" onPress={() => BackHandler.exitApp()} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
const styles = StyleSheet.create({ scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' } });
