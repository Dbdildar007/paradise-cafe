import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ClayBadge } from '../components/ClayBadge';
import { ClayButton } from '../components/ClayButton';
import { GlassCard } from '../components/GlassCard';
import { WifiOffIcon } from '../components/icons';
import { NeuSurface } from '../components/NeuSurface';
import { Screen } from '../components/Screen';
import { colors, layout } from '../theme';
import { useResponsive } from '../utils/responsive';

type Props = {
  onRetry: () => void | Promise<unknown>;
  isChecking?: boolean;
};

const TIPS = ['Turn off airplane mode', 'Switch between Wi-Fi and mobile data'];

export const NoInternetScreen: React.FC<Props> = ({ onRetry, isChecking = false }) => {
  const { s, height } = useResponsive();
  const compact = height < 620; // landscape phones / split-screen
  const outer = s(compact ? 128 : 176);
  const well = s(compact ? 98 : 134);
  const badge = s(compact ? 68 : 92);

  return (
    <Screen testID="no-internet-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        accessibilityLiveRegion="polite">
        <NeuSurface radius={outer} style={{ width: outer, height: outer }}>
          <View style={styles.fill}>
            <NeuSurface variant="inset" radius={well} style={{ width: well, height: well, alignItems: 'center', justifyContent: 'center' }}>
              <ClayBadge size={badge} color={colors.primary}>
                <WifiOffIcon size={badge * 0.52} color={colors.silk} />
              </ClayBadge>
            </NeuSurface>
          </View>
        </NeuSurface>

        <AppText
          accessibilityRole="header"
          variant="headlineLg"
          color={colors.tertiary}
          style={{ marginTop: s(32), textAlign: 'center' }}>
          No internet connection
        </AppText>
        <AppText variant="bodyLg" style={{ marginTop: s(8), textAlign: 'center', maxWidth: s(320) }}>
          Check your mobile data or Wi-Fi, then try again. We will reconnect as soon as you are back online.
        </AppText>

        <GlassCard radius={s(32)} style={{ alignSelf: 'stretch', marginTop: s(28) }} tint="rgba(255,255,255,0.7)">
          <View style={{ padding: s(16), gap: s(12) }}>
            {TIPS.map(tip => (
              <View key={tip} style={styles.tip}>
                <ClayBadge size={s(10)} color={colors.secondary} />
                <AppText variant="bodyMd" style={{ marginLeft: s(12), flex: 1 }}>
                  {tip}
                </AppText>
              </View>
            ))}
          </View>
        </GlassCard>

        <View style={{ alignSelf: 'stretch', marginTop: s(28), gap: s(12) }}>
          <ClayButton testID="retry-button" label="Try again" onPress={() => {
              onRetry();
            }} loading={isChecking} />
          <ClayButton
            testID="open-settings-button"
            variant="secondary"
            label="Open settings"
            onPress={() => {
              Linking.openSettings();
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.marginLg,
  },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center' },
});
