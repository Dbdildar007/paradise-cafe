import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { GlassCard } from '../../../components/GlassCard';
import { CheckIcon, FlagIndiaIcon } from '../../../components/icons';
import { colors, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { COUNTRY } from '../phone';

type Props = { visible: boolean; onClose: () => void; onSelect: () => void };

/** Bottom glass sheet. The app serves India only, so the list has exactly one (always selected) entry. */
export const CountryPickerSheet: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const { s, contentWidth } = useResponsive();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        testID="country-backdrop"
        accessibilityLabel="Close country list"
        style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.35) }]}
        onPress={onClose}>
        <View style={{ width: contentWidth, padding: s(16) }}>
          <GlassCard radius={s(32)} tint="rgba(255,255,255,0.92)">
            <View style={{ padding: s(20) }}>
              <AppText variant="headlineSm" color={colors.onSurface} accessibilityRole="header">
                Select country
              </AppText>
              <Pressable
                testID="country-option-IN"
                accessibilityRole="radio"
                accessibilityState={{ selected: true }}
                accessibilityLabel={`${COUNTRY.name} ${COUNTRY.dial}`}
                onPress={() => {
                  onSelect();
                  onClose();
                }}
                style={[styles.row, { marginTop: s(14), padding: s(14), borderRadius: s(18), backgroundColor: colors.surfaceLow }]}>
                <FlagIndiaIcon width={s(30)} />
                <AppText variant="labelLg" color={colors.onSurface} style={{ flex: 1, marginLeft: s(12) }}>
                  {COUNTRY.name}
                </AppText>
                <AppText variant="labelLg" color={colors.neutral} style={{ marginRight: s(10) }}>
                  {COUNTRY.dial}
                </AppText>
                <CheckIcon size={s(18)} color={colors.primary} />
              </Pressable>
              <AppText variant="bodySm" color={colors.neutral} style={{ marginTop: s(12) }}>
                Paradise Cafe currently delivers in India only.
              </AppText>
            </View>
          </GlassCard>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
