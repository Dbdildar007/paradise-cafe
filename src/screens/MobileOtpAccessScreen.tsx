import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { ClayButton } from '../components/ClayButton';
import { GlassCard } from '../components/GlassCard';
import { ArrowRightIcon } from '../components/icons';
import { formatCountdown } from '../features/otp/countdown';
import { BlockingLoader } from '../features/otp/components/BlockingLoader';
import { CountryPickerSheet } from '../features/otp/components/CountryPickerSheet';
import { LegalText } from '../features/otp/components/LegalText';
import { OtpBoxes } from '../features/otp/components/OtpBoxes';
import { OtpHeader } from '../features/otp/components/OtpHeader';
import { PageDots } from '../features/otp/components/PageDots';
import { PhoneField } from '../features/otp/components/PhoneField';
import { defaultOtpDeps } from '../features/otp/defaultDeps';
import type { OtpDeps } from '../features/otp/types';
import { useCountdown } from '../features/otp/useCountdown';
import { useOtpFlow } from '../features/otp/useOtpFlow';
import type { RootScreenProps } from '../navigation/types';
import { requestDevicePhoneNumber } from '../services/auth/phoneHint';
import { colors, glass, layout, withAlpha } from '../theme';
import { useResponsive } from '../utils/responsive';

type Props = RootScreenProps<'MobileOtpAccess'> & {
  /** Test seams (default to the real Firebase / Supabase services). */
  deps?: OtpDeps;
  requestPhoneHint?: () => Promise<string | null>;
};

/**
 * mobile_otp_access - Zomato-style phone login (Firebase Phone Auth).
 *  1. Tap the number field -> (Android) device numbers sheet -> pick one -> OTP is sent automatically, or type a number.
 *  2. While the number field is focused the OTP boxes and Verify button are hidden.
 *  3. "Get OTP" -> OTP boxes appear; the SMS is auto-read on Android; 60 s resend timer; max 3 resends / 5 h.
 *  4. Verified -> backend profile is created (new user) or loaded (returning user) -> Home.
 */
export const MobileOtpAccessScreen: React.FC<Props> = ({ navigation, deps = defaultOtpDeps, requestPhoneHint = requestDevicePhoneNumber }) => {
  const { s, font, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const hintOffered = useRef(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const onAuthenticated = useCallback(() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }), [navigation]);
  const flow = useOtpFlow({ deps, onAuthenticated });
  const { state } = flow;

  const seconds = useCountdown(state.cooldownUntil, deps.now);
  const showOtp = !!state.verificationId && !phoneFocused;
  const canResend = seconds === 0 && state.resendsLeft > 0 && !flow.busy;
  const otpHasError = !!state.otpError;

  // Focus the hidden OTP input whenever the boxes (re)appear and are empty.
  useEffect(() => {
    if (showOtp && state.phase === 'otp' && state.otp === '' && state.attemptsLeft > 0) {
      otpRef.current?.focus();
    }
  }, [showOtp, state.phase, state.otp, state.attemptsLeft, state.verificationId]);

  const onPhoneFocus = useCallback(async (): Promise<void> => {
    setPhoneFocused(true);
    if (hintOffered.current || state.phone !== '' || Platform.OS !== 'android') {
      return;
    }
    hintOffered.current = true; // offer the device numbers once per visit
    phoneRef.current?.blur();

    try {
      // Attempt to fetch phone hint (works on physical devices with Google Play Services)
      const picked = await requestPhoneHint();
      if (picked) {
        setPhoneFocused(false);
        flow.submitDevicePhone(picked); // fill + send OTP automatically
      } else {
        phoneRef.current?.focus(); // dismissed by user
      }
    } catch (error) {
      setPhoneFocused(true);
      phoneRef.current?.focus();
    }
  }, [flow, requestPhoneHint, state.phone]);

  const onGetOtp = useCallback(() => {
    phoneRef.current?.blur();
    void flow.requestOtp(state.verificationId ? 'resend' : 'send');
  }, [flow, state.verificationId]);

  const loaderMessage = state.phase === 'sending' ? 'Sending OTP…' : 'Verifying…';

  return (
    <View testID="screen-mobile-otp-access" style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(colors.goldSoft, 0.55), colors.surface, colors.surfaceLow]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          testID="otp-scroll"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingTop: insets.top + s(18), paddingBottom: insets.bottom + s(24) }}>
          <View style={{ width: contentWidth, paddingHorizontal: layout.margin }}>
            <OtpHeader />

            <GlassCard radius={s(44)} tint={glass.tintLight} style={{ marginTop: s(26) }}>
              <LinearGradient
                pointerEvents="none"
                colors={[withAlpha(colors.secondaryContainer, 0.9), 'transparent']}
                style={{ position: 'absolute', top: 0, left: s(40), right: s(40), height: 3, borderRadius: 3 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={{ paddingHorizontal: s(24), paddingTop: s(30), paddingBottom: s(24) }}>
                <AppText variant="headlineLg" color={colors.onSurface} accessibilityRole="header" style={{ textAlign: 'center', fontSize: font(25), lineHeight: font(32) }}>
                  Your cravings, our paradise.
                </AppText>
                <AppText variant="bodyLg" color={colors.neutral} style={{ marginTop: s(8), textAlign: 'center', fontSize: font(15), lineHeight: font(26) }}>
                  Discover royal biryanis, authentic curries, and handcrafted culinary delicacies delivered fresh to your doorstep.
                </AppText>

                <AppText variant="bodyLg" color={colors.neutral} style={{ marginTop: s(26), marginBottom: s(10), fontSize: font(15) }}>
                  Direct Doorstep Access
                </AppText>
                <PhoneField
                  ref={phoneRef}
                  digits={state.phone}
                  editable={!flow.busy}
                  onChangeDigits={flow.setPhone}
                  onFocus={onPhoneFocus}
                  onBlur={() => setPhoneFocused(false)}
                  onPressCountry={() => setCountryOpen(true)}
                  onSubmit={() => phoneRef.current?.blur()}
                />
                {state.error ? (
                  <AppText testID="phone-error" accessibilityLiveRegion="polite" variant="bodySm" color={colors.error} style={{ marginTop: s(8), marginLeft: s(8), fontSize: font(13) }}>
                    {state.error}
                  </AppText>
                ) : null}

                {showOtp ? (
                  <View testID="otp-section" style={{ marginTop: s(24) }}>
                    <View style={styles.labelRow}>
                      <AppText variant="labelMd" color={colors.onSurface} style={{ fontSize: font(14), letterSpacing: font(0.6), flexShrink: 1 }}>
                        PASSCODE VERIFICATION
                      </AppText>
                      <View style={styles.resend}>
                        {seconds > 0 ? (
                          <View testID="resend-timer" style={[styles.timer, { backgroundColor: withAlpha(colors.secondaryContainer, 0.55), paddingHorizontal: s(8), paddingVertical: s(3), marginRight: s(8) }]}>
                            <AppText variant="labelSm" color={colors.goldDeep} style={{ fontSize: font(12) }}>
                              {formatCountdown(seconds)}
                            </AppText>
                          </View>
                        ) : state.resendsLeft === 0 ? (
                          <AppText testID="resend-limit" variant="labelSm" color={colors.error} style={{ fontSize: font(11), marginRight: s(8) }}>
                            Limit reached
                          </AppText>
                        ) : null}
                        <Pressable
                          testID="resend-button"
                          accessibilityRole="button"
                          accessibilityLabel={canResend ? 'Resend OTP' : `Resend OTP, available in ${formatCountdown(seconds)}`}
                          accessibilityState={{ disabled: !canResend }}
                          disabled={!canResend}
                          hitSlop={10}
                          onPress={() => {
                            flow.requestOtp('resend');
                          }}>
                          <AppText variant="labelLg" color={canResend ? colors.goldDeep : withAlpha(colors.neutral, 0.45)} style={{ fontSize: font(14) }}>
                            Resend OTP
                          </AppText>
                        </Pressable>
                      </View>
                    </View>

                    <View style={{ marginTop: s(14) }}>
                      <OtpBoxes ref={otpRef} value={state.otp} onChange={flow.setOtp} editable={!flow.busy && state.attemptsLeft > 0} hasError={otpHasError} />
                    </View>
                    {state.otpError ? (
                      <AppText testID="otp-error" accessibilityLiveRegion="assertive" variant="bodySm" color={colors.error} style={{ marginTop: s(10), textAlign: 'center', fontSize: font(13) }}>
                        {state.otpError}
                      </AppText>
                    ) : null}

                    <ClayButton
                      testID="verify-button"
                      label="Verify & Enter Paradise"
                      onPress={() => flow.verify()}
                      disabled={!flow.canVerify}
                      fill={colors.primaryDeep}
                      labelVariant="headlineSm"
                      style={{ marginTop: s(22), height: s(56) }}
                      trailing={<ArrowRightIcon size={s(20)} color={colors.goldSoft} />}
                    />
                  </View>
                ) : (
                  <ClayButton
                    testID="get-otp-button"
                    label="Get OTP"
                    onPress={onGetOtp}
                    disabled={!flow.canGetOtp}
                    fill={colors.primaryDeep}
                    labelVariant="headlineSm"
                    style={{ marginTop: s(22), height: s(56) }}
                    trailing={<ArrowRightIcon size={s(20)} color={colors.goldSoft} />}
                  />
                )}

                <View style={{ marginTop: s(20) }}>
                  <LegalText />
                </View>
              </View>
            </GlassCard>

            <View style={{ alignItems: 'center', marginTop: s(28) }}>
              <PageDots active={1} />
              <AppText variant="labelMd" color={withAlpha(colors.neutral, 0.75)} style={{ marginTop: s(12), fontSize: font(12.5), letterSpacing: font(1.8), textAlign: 'center' }}>
                EST. 1984 • CRAFTED WITH DEVOTION
              </AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerSheet visible={countryOpen} onClose={() => setCountryOpen(false)} onSelect={() => undefined} />
      <BlockingLoader visible={flow.busy} message={loaderMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resend: { flexDirection: 'row', alignItems: 'center' },
  timer: { borderRadius: 9999 },
});
