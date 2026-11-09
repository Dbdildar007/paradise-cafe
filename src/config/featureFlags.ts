/**
 * Diagnostic switches for isolating rendering problems on a device. All false in normal operation.
 * If the Welcome page is blank, set ONE flag to true at a time, reload (press R R / `r` in Metro), and see which one fixes it:
 *   disableReveal    - removes the fade-up entrance animations (Animated.View opacity 0 -> 1)
 *   disableBlur      - replaces native BlurView with a plain translucent tint
 *   disableHeroImage - uses the drawn gradient hero instead of welcome-hero.jpg
 */
export const DIAGNOSTIC = {
  disableReveal: false,
  disableBlur: false,
  disableHeroImage: false,
} as const;
