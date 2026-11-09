import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';
import { layout } from '../theme/spacing';

const BASE_WIDTH = 390; // design reference (iPhone 14 / common Android)
const MIN_SCALE = 0.82; // small phones (320dp)
const MAX_SCALE = 1.3; // tablets / foldables

/** Pure & testable: window width -> scale factor. */
export const computeScale = (width: number): number => {
  const w = Math.min(width, layout.maxContentWidth * 1.4);
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, w / BASE_WIDTH));
};

/**
 * Responsive helpers that react to rotation, split-screen and fold changes.
 *  s(n)    scale a dimension
 *  font(n) scale a font size (damped so text never explodes on tablets)
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const scale = computeScale(width);
    const round = (n: number) => PixelRatio.roundToNearestPixel(n);
    return {
      width,
      height,
      scale,
      isTablet: Math.min(width, height) >= 600,
      isLandscape: width > height,
      contentWidth: Math.min(width, layout.maxContentWidth),
      s: (n: number) => round(n * scale),
      font: (n: number) => round(n * (1 + (scale - 1) * 0.6)),
    };
  }, [width, height]);
};
export type Responsive = ReturnType<typeof useResponsive>;
