import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { ChevronDownIcon, FlagIndiaIcon } from '../../../components/icons';
import { NeuSurface } from '../../../components/NeuSurface';
import { colors, elevation, withAlpha } from '../../../theme';
import { fontFamily } from '../../../theme/typography';
import { useResponsive } from '../../../utils/responsive';
import { COUNTRY, formatIndianMobile } from '../phone';

type Props = {
  digits: string;
  editable: boolean;
  onChangeDigits: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPressCountry: () => void;
  onSubmit: () => void;
};

/** Recessed neumorphic well with a raised clay country chip (India only) and the number input. */
export const PhoneField = forwardRef<TextInput, Props>(
  ({ digits, editable, onChangeDigits, onFocus, onBlur, onPressCountry, onSubmit }, ref) => {
    const { s, font } = useResponsive();
    return (
      <NeuSurface variant="inset" radius={9999} fill={colors.surfaceContainer} style={{ height: s(56), justifyContent: 'center' }}>
        <View style={[styles.row, { paddingHorizontal: s(6) }]}>
          <Pressable
            testID="country-chip"
            accessibilityRole="button"
            accessibilityLabel={`Country code ${COUNTRY.dial} ${COUNTRY.name}. Tap to change`}
            onPress={onPressCountry}
            disabled={!editable}
            style={[
              elevation.level1,
              styles.chip,
              { height: s(44), paddingHorizontal: s(10), borderRadius: s(16), backgroundColor: colors.silk, borderColor: withAlpha(colors.silk, 0.9) },
            ]}>
            <FlagIndiaIcon width={s(24)} />
            <AppText variant="labelLg" color={colors.onSurface} style={{ marginHorizontal: s(8), fontSize: font(15) }}>
              {COUNTRY.dial}
            </AppText>
            <ChevronDownIcon size={s(14)} color={colors.neutral} />
          </Pressable>
          <TextInput
            ref={ref}
            testID="phone-input"
            value={formatIndianMobile(digits)}
            onChangeText={onChangeDigits}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmit}
            editable={editable}
            placeholder="Enter mobile number"
            placeholderTextColor={withAlpha(colors.neutral, 0.55)}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={11}
            inputMode="numeric"
            textContentType="telephoneNumber"
            autoComplete="tel"
            importantForAutofill="yes"
            selectionColor={colors.primary}
            accessibilityLabel="Mobile number"
            maxFontSizeMultiplier={1.2}
            style={[
              styles.input,
              { fontSize: font(digits ? 22 : 17), marginLeft: s(14), color: colors.onSurface, fontFamily: fontFamily.inter, letterSpacing: digits ? font(0.8) : 0 },
            ]}
          />
        </View>
      </NeuSurface>
    );
  },
);
PhoneField.displayName = 'PhoneField';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, paddingVertical: 0, minHeight: 44 },
});
