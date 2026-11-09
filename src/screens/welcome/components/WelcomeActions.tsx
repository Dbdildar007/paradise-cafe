import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { ClayBadge } from '../../../components/ClayBadge';
import { ClayButton } from '../../../components/ClayButton';
import { ArrowRightIcon, PhoneIcon } from '../../../components/icons';
import { colors } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { WELCOME_COPY } from '../welcomeContent';

type Props = { onExplore: () => void; onSignIn: () => void; onGuest: () => void };

/** The three conversion paths: order now, sign in with mobile, or browse as guest. */
export const WelcomeActions: React.FC<Props> = ({ onExplore, onSignIn, onGuest }) => {
  const { s, font } = useResponsive();
  return (
    <View>
      <ClayButton
        testID="welcome-explore"
        label={WELCOME_COPY.cta}
        onPress={onExplore}
        align="start"
        labelVariant="headlineSm"
        accessibilityHint="Opens the menu"
        style={{ height: s(56) }}
        trailing={
          <ClayBadge size={s(40)} color={colors.cocoaLight}>
            <ArrowRightIcon size={s(18)} color={colors.silk} />
          </ClayBadge>
        }
      />
      <ClayButton
        testID="welcome-signin"
        variant="soft"
        label={WELCOME_COPY.signIn}
        onPress={onSignIn}
        accessibilityHint="Sign in with your mobile number and a one-time password"
        style={{ marginTop: s(14), height: s(56) }}
        leading={<PhoneIcon size={s(20)} color={colors.tertiary} />}
      />
      <Pressable
        testID="welcome-guest"
        accessibilityRole="link"
        accessibilityLabel={WELCOME_COPY.guest}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={onGuest}
        style={({ pressed }) => ({ alignSelf: 'center', marginTop: s(20), paddingVertical: s(8), opacity: pressed ? 0.6 : 1 })}>
        <AppText variant="labelLg" color={colors.tertiary} style={{ fontSize: font(14), textDecorationLine: 'underline', textAlign: 'center' }}>
          {WELCOME_COPY.guest}
        </AppText>
      </Pressable>
    </View>
  );
};
