import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { NeuSurface } from '../../../components/NeuSurface';
import { colors, elevation, withAlpha } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { OTP_POLICY } from '../otpPolicy';

type Props = {
  value: string;
  onChange: (text: string) => void;
  editable: boolean;
  hasError: boolean;
};

/**
 * Six visual boxes driven by ONE hidden TextInput (so paste, iOS "From Messages" suggestion and Android autofill all work).
 * Filled digit = raised clay disc with a gold ring. Empty = recessed well with a dot.
 */
export const OtpBoxes = forwardRef<TextInput, Props>(({ value, onChange, editable, hasError }, ref) => {
  const { s, font } = useResponsive();
  const focusRef = React.useRef<TextInput | null>(null);
  const setRefs = (node: TextInput | null) => {
    focusRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<TextInput | null>).current = node;
    }
  };
  const active = Math.min(value.length, OTP_POLICY.length - 1);

  return (
    <View testID="otp-boxes">
      <View style={[styles.row, { gap: s(8) }]}>
        {Array.from({ length: OTP_POLICY.length }, (_, i) => {
          const digit = value[i];
          const isActive = i === active && editable;
          return (
            <View key={i} style={styles.cell} testID={`otp-box-${i}`}>
              {digit ? (
                <View
                  style={[
                    elevation.level1,
                    styles.box,
                    {
                      height: s(52),
                      borderRadius: s(26),
                      backgroundColor: colors.silk,
                      borderWidth: 2,
                      borderColor: hasError ? colors.error : colors.secondaryContainer,
                    },
                  ]}>
                  <AppText variant="headlineMd" color={colors.onSurface} style={{ fontSize: font(22) }}>
                    {digit}
                  </AppText>
                </View>
              ) : (
                <NeuSurface variant="inset" radius={s(26)} fill={colors.surfaceContainer} style={{ height: s(52) }}>
                  <View style={styles.box}>
                    <View
                      style={{
                        width: isActive ? s(9) : s(7),
                        height: isActive ? s(9) : s(7),
                        borderRadius: s(5),
                        backgroundColor: isActive ? colors.goldDeep : withAlpha(colors.neutral, 0.28),
                      }}
                    />
                  </View>
                </NeuSurface>
              )}
            </View>
          );
        })}
      </View>
      {/* Hidden input spans the boxes; tapping anywhere focuses it. */}
      <TextInput
        ref={setRefs}
        testID="otp-input"
        value={value}
        onChangeText={onChange}
        editable={editable}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={OTP_POLICY.length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel={`Enter the ${OTP_POLICY.length} digit OTP`}
        style={styles.hidden}
      />
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={StyleSheet.absoluteFill}
        onPress={() => focusRef.current?.focus()}
      />
    </View>
  );
});
OtpBoxes.displayName = 'OtpBoxes';

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, maxWidth: 64 },
  box: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', width: '100%', height: '100%', opacity: 0.02, color: 'transparent' },
});
