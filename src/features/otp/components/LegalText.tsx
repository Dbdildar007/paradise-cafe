import React from 'react';
import { Linking, Text } from 'react-native';
import { LEGAL_URLS } from '../../../config/api';
import { colors, MAX_FONT_MULTIPLIER } from '../../../theme';
import { typography } from '../../../theme/typography';
import { useResponsive } from '../../../utils/responsive';

/** Only https links are ever opened. */
export const openSafeUrl = async (url: string): Promise<boolean> => {
  if (!url.startsWith('https://')) {
    return false;
  }
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

export const LegalText: React.FC = () => {
  const { font } = useResponsive();
  const base = { fontFamily: typography.bodyMd.fontFamily, fontSize: font(14), lineHeight: font(21), color: colors.neutral };
  const link = { ...base, color: colors.goldDeep, fontWeight: '600' as const };
  return (
    <Text testID="legal-text" maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={[base, { textAlign: 'center' }]}>
      By continuing, you agree to our{' '}
      <Text testID="legal-terms" accessibilityRole="link" style={link} onPress={() => {
          openSafeUrl(LEGAL_URLS.terms);
        }}>
        Terms of Service
      </Text>{' '}
      &{' '}
      <Text testID="legal-privacy" accessibilityRole="link" style={link} onPress={() => {
          openSafeUrl(LEGAL_URLS.privacy);
        }}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
};
