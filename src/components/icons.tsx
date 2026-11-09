import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

/** Serving cloche (splash logo). */
export const ClocheIcon: React.FC<IconProps> = ({ size = 40, color = '#FFDCC6' }) => (
  <Svg width={size} height={size * 0.78} viewBox="0 0 48 38" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx="24" cy="5" r="3.2" fill={color} />
    <Path d="M4 28 C4 15 13 9 24 9 C35 9 44 15 44 28 Z" fill={color} />
    <Rect x="0" y="31" width="48" height="5" rx="2.5" fill={color} />
  </Svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 18, color = '#E3BFAD' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path
      d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.5 1.1 4.3 2.5.3.5.9.5 1.2 0 .8-1.4 2.3-2.5 4.3-2.5 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z"
      fill={color}
    />
  </Svg>
);

/** Wi-Fi with slash (offline). */
export const WifiOffIcon: React.FC<IconProps> = ({ size = 64, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M6 19c9.5-8 26.5-8 36 0" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
    <Path d="M13 27c6-5 16-5 22 0" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
    <Path d="M20 34.5c2.5-2 5.5-2 8 0" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
    <Circle cx="24" cy="41" r="2.6" fill={color} />
    <Path d="M8 6l32 36" stroke={color} strokeWidth={4} strokeLinecap="round" />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 56, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10l16-6z" fill={color} />
    <Path d="M16 24l6 6 11-12" stroke="#6F4E37" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size = 14, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M12 2C12.6 7.5 16.5 11.4 22 12C16.5 12.6 12.6 16.5 12 22C11.4 16.5 7.5 12.6 2 12C7.5 11.4 11.4 7.5 12 2Z" fill={color} />
  </Svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const StarOutlineIcon: React.FC<IconProps> = ({ size = 16, color = '#493225' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path
      d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const StarCircleIcon: React.FC<IconProps> = ({ size = 30, color = '#493225' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx="12" cy="12" r="10.5" stroke={color} strokeWidth={1.8} fill="none" />
    <Path d="M12 6.6l1.5 3.2 3.5.4-2.6 2.4.7 3.5L12 14.3 8.9 16.1l.7-3.5L7 10.2l3.5-.4L12 6.6z" fill={color} />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 20, color = '#493225' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Rect x="6.5" y="2.5" width="11" height="19" rx="2.6" stroke={color} strokeWidth={1.8} fill="none" />
    <Path d="M10 5.2h4M10.5 18.6h3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 14, color = '#C9A87C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M3 8l4.2 4L12 5l4.8 7L21 8l-2 11H5L3 8z" fill={color} />
  </Svg>
);

/** Brand mark: steaming dum-handi bowl. */
export const SteamBowlIcon: React.FC<IconProps> = ({ size = 40, color = '#FFDCC6' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M16 5c-2 2.5 2 4.5 0 7M24 4c-2 2.5 2 4.5 0 7M32 5c-2 2.5 2 4.5 0 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <Path d="M6 20h36c0 11-7.5 18-18 18S6 31 6 20z" fill={color} />
    <Rect x="14" y="40" width="20" height="3.6" rx="1.8" fill={color} />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 14, color = '#50453E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 18, color = '#6F4E37' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

/** Flag of India (drawn, so it renders identically on every OS - emoji flags are missing on Windows/older Android). */
export const FlagIndiaIcon: React.FC<{ width?: number }> = ({ width = 30 }) => (
  <Svg width={width} height={width * 0.68} viewBox="0 0 30 20" accessibilityElementsHidden importantForAccessibility="no">
    <Rect x="0" y="0" width="30" height="6.7" rx="2" fill="#FF9933" />
    <Rect x="0" y="6.7" width="30" height="6.6" fill="#FFFFFF" />
    <Rect x="0" y="13.3" width="30" height="6.7" rx="2" fill="#138808" />
    <Circle cx="15" cy="10" r="2.6" stroke="#000080" strokeWidth={0.9} fill="none" />
    <Circle cx="15" cy="10" r="0.7" fill="#000080" />
  </Svg>
);

/** Small decorative glyph inside the "HERITAGE GASTRONOMY" pill. */
export const HeritageGlyphIcon: React.FC<IconProps> = ({ size = 14, color = '#745A34' }) => (
  <Svg width={size * 1.6} height={size} viewBox="0 0 32 20" accessibilityElementsHidden importantForAccessibility="no">
    <Rect x="1" y="8" width="12" height="6" rx="1.6" fill={color} />
    <Rect x="4" y="4" width="4" height="4" rx="1" fill={color} />
    <Rect x="20" y="8" width="6" height="6" rx="1.4" fill={color} />
  </Svg>
);

/** Brand flower used in the divider under the tagline. */
export const FlowerIcon: React.FC<IconProps> = ({ size = 22, color = '#C9A87C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx="12" cy="7" r="3.2" fill={color} opacity={0.75} />
    <Circle cx="7" cy="11" r="3.2" fill={color} opacity={0.75} />
    <Circle cx="17" cy="11" r="3.2" fill={color} opacity={0.75} />
    <Circle cx="12" cy="12" r="3.4" fill={color} />
    <Path d="M12 15.5c-1.2 2.6-3.4 4-6 4.2 1.2-2.6 3.4-4 6-4.2zM12 15.5c1.2 2.6 3.4 4 6 4.2-1.2-2.6-3.4-4-6-4.2z" fill={color} opacity={0.85} />
  </Svg>
);

/** Brand medallion: stitched cocoa disc with a leaf/drop and steam. */
export const MedallionIcon: React.FC<{ size?: number; disc?: string; cream?: string; gold?: string }> = ({
  size = 80,
  disc = '#6F4E37',
  cream = '#FFF1EC',
  gold = '#C9A87C',
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx="50" cy="50" r="48" fill={disc} />
    <Circle cx="50" cy="50" r="43" stroke={cream} strokeOpacity={0.55} strokeWidth={1.4} strokeDasharray="3 3" fill="none" />
    <Path d="M43 17c-2.5-3.5 2.5-5 0-9M51 17c-2.5-3.5 2.5-5 0-9" stroke={cream} strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" fill="none" />
    <Path d="M50 24C58 34 67 42 63 55C60 64 55 67 50 67C45 67 40 64 37 55C33 42 42 34 50 24Z" fill={cream} />
    <Path d="M50 36C53 42 54.5 47 52 56C51.3 58.5 49.7 58.5 49 56C46.5 47 47 42 50 36Z" fill={gold} />
    <Path d="M38 76Q50 82 62 76" stroke={cream} strokeOpacity={0.7} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </Svg>
);
