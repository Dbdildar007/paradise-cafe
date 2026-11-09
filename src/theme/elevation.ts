import { Platform, ViewStyle } from 'react-native';
import { colors, withAlpha } from './colors';

/**
 * Elevation recipes from DESIGN.md. RN has no inset shadows / CSS blur, so:
 *  - raised / clay shadows -> shadow* (iOS) + elevation (Android)
 *  - inset (neumorphic wells) -> components/NeuSurface (gradient overlays)
 *  - glass -> components/GlassCard (BlurView + translucent tint + rim)
 */
const shadow = (color: string, opacity: number, blurRadius: number, y: number, elev: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: { shadowColor: color, shadowOpacity: opacity, shadowRadius: blurRadius, shadowOffset: { width: 0, height: y } },
    default: { elevation: elev, shadowColor: color },
  }) as ViewStyle;

export const elevation = {
  level1: shadow(colors.primary, 0.1, 14, 4, 2),
  level2: shadow(colors.tertiary, 0.12, 20, 12, 8),
  clay: shadow(colors.primary, 0.15, 8, 4, 5),
  neuLight: shadow('#FFFFFF', 0.9, 8, -3, 0),
  neuDark: shadow(colors.neutral, 0.16, 8, 4, 3),
} as const;

export const glass = {
  tintLight: 'rgba(253, 251, 247, 0.78)',
  tintCapsule: 'rgba(253, 251, 247, 0.82)',
  tintDark: 'rgba(255, 255, 255, 0.12)',
  tintSmoke: withAlpha(colors.night, 0.55), // glass pills floating over photography
  rimTop: 'rgba(255, 255, 255, 0.9)',
  rimBottom: withAlpha(colors.secondary, 0.25),
  blur: 20,
} as const;
