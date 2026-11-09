export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, DEFAULT: 16, md: 24, lg: 32, xl: 48, full: 9999 } as const;
export const layout = {
  margin: 16,
  marginLg: 24,
  navCapsuleHeight: 64,
  ctaHeight: 52,
  minTouch: 44,
  maxContentWidth: 560, // tablets / foldables: content column never stretches wider
} as const;
