import { Platform, TextStyle } from 'react-native';

/**
 * Plus Jakarta Sans (headlines/labels) + Inter (body). Font files go in assets/fonts and are linked with
 * `npx react-native-asset`. Android resolves weight by file name, so each weight maps to a family name.
 */
const jakarta = (w: '600' | '700' | '800'): string =>
  Platform.select({
    ios: 'Plus Jakarta Sans',
    default: `PlusJakartaSans-${w === '600' ? 'SemiBold' : w === '700' ? 'Bold' : 'ExtraBold'}`,
  }) as string;
const inter = Platform.select({ ios: 'Inter', default: 'Inter-Regular' }) as string;

export const fontFamily = { jakarta, inter };
export const MAX_FONT_MULTIPLIER = 1.25; // keeps layouts intact under large accessibility fonts

export type Variant = {
  fontFamily: string;
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  lineHeight: number;
  letterSpacing?: number;
};

/** Base sizes from DESIGN.md. Components scale them through useResponsive().font(). */
const definitions = {
  displayLg: { fontFamily: jakarta('700'), fontSize: 36, fontWeight: '700', lineHeight: 44, letterSpacing: -0.72 },
  displayLgMobile: { fontFamily: jakarta('700'), fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.56 },
  headlineLg: { fontFamily: jakarta('700'), fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.48 },
  headlineMd: { fontFamily: jakarta('600'), fontSize: 20, fontWeight: '600', lineHeight: 28, letterSpacing: -0.4 },
  headlineSm: { fontFamily: jakarta('600'), fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.36 },
  bodyLg: { fontFamily: inter, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMd: { fontFamily: inter, fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySm: { fontFamily: inter, fontSize: 12, fontWeight: '400', lineHeight: 16 },
  labelLg: { fontFamily: jakarta('600'), fontSize: 14, fontWeight: '600', lineHeight: 18 },
  labelMd: { fontFamily: jakarta('600'), fontSize: 12, fontWeight: '600', lineHeight: 16 },
  labelSm: { fontFamily: jakarta('700'), fontSize: 10, fontWeight: '700', lineHeight: 12 },
} satisfies Record<string, Variant>;
export type TypographyVariant = keyof typeof definitions;
export const typography: Record<TypographyVariant, Variant> = definitions;
