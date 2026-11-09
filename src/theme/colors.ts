/** Source of truth: docs/DESIGN.md ("Warm Tactile Hospitality"). Do not hard-code hex elsewhere. */
export const colors = {
  primary: '#6F4E37', // Cocoa Brown
  secondary: '#C9A87C', // Muted Gold
  tertiary: '#493225', // Deep Cocoa
  neutral: '#5A433B', // Roasted Coffee

  canvas: '#FDFBF7', // Milk Foam
  silk: '#FFFFFF', // White Silk
  divider: '#E9E0D6', // Subtle Divider
  cream: '#F5EEE5', // Warm Cream (neumorphic wells)

  success: '#48765B',
  error: '#B94A48',

  // Tonal values from the DESIGN.md front-matter (used on dark brand surfaces such as the splash)
  night: '#402C24', // inverse-surface
  peach: '#FFDCC6', // primary-fixed
  peachDim: '#EABDA0', // primary-fixed-dim
  goldSoft: '#FFDDB2', // secondary-fixed
  blush: '#E3BFAD', // tertiary-fixed-dim
  outlineVariant: '#D4C3BA',

  // Light-surface tonal ramp from DESIGN.md front-matter (Welcome page, cards, chips)
  surface: '#FFF8F6',
  surfaceLow: '#FFF1EC', // surface-container-low
  surfaceContainer: '#FFE9E3',
  surfaceHigh: '#FFE2D9',
  goldDeep: '#745A34', // secondary (front-matter): eyebrow labels
  primaryDeep: '#553722', // primary (front-matter): high-emphasis CTA
  onSurface: '#291711', // on-surface (front-matter): headings on light surfaces
  secondaryContainer: '#FEDAAA', // gold rings / glow
  cocoaLight: '#8A6D5A', // primary lightened ~20%: arrow badge on the primary CTA
} as const;

export type ColorToken = keyof typeof colors;

export const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
