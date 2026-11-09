import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { WELCOME_HERO } from '../../../config/assets';
import { DIAGNOSTIC } from '../../../config/featureFlags';
import { colors, withAlpha } from '../../../theme';

type Props = { height: number; width: number };

/** Bokeh "lantern light" positions as fractions of the hero box. */
const BOKEH = [
  { x: 0.08, y: 0.28, r: 0.13, o: 0.5 },
  { x: 0.22, y: 0.12, r: 0.07, o: 0.4 },
  { x: 0.55, y: 0.18, r: 0.09, o: 0.32 },
  { x: 0.72, y: 0.1, r: 0.06, o: 0.45 },
  { x: 0.88, y: 0.3, r: 0.1, o: 0.3 },
  { x: 0.4, y: 0.42, r: 0.12, o: 0.22 },
  { x: 0.8, y: 0.52, r: 0.08, o: 0.25 },
] as const;

/**
 * Full-bleed hero that dissolves into the page surface. Uses the photo from config/assets.ts when present,
 * otherwise a drawn warm bokeh scene. The bottom gradient guarantees a seamless hand-off to the content.
 */
export const HeroBackdrop: React.FC<Props> = ({ height, width }) => {
  const [imageFailed, setImageFailed] = useState(false);
  return (
  <View pointerEvents="none" style={[styles.root, { width, height }]} testID="welcome-hero">
    {WELCOME_HERO && !DIAGNOSTIC.disableHeroImage && !imageFailed ? (
      <Image
        source={WELCOME_HERO}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
        onError={() => setImageFailed(true)}
      />
    ) : (
      <>
        <LinearGradient
          colors={[colors.tertiary, colors.night, colors.primary]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {BOKEH.map((b, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: b.x * width - (b.r * width) / 2,
              top: b.y * height - (b.r * width) / 2,
              width: b.r * width,
              height: b.r * width,
              borderRadius: b.r * width,
              backgroundColor: withAlpha(colors.goldSoft, b.o),
            }}
          />
        ))}
        <View style={[styles.table, { backgroundColor: withAlpha(colors.secondary, 0.22), height: height * 0.35 }]} />
      </>
    )}
    <LinearGradient
      colors={['transparent', withAlpha(colors.surface, 0.55), colors.surface]}
      locations={[0.45, 0.78, 1]}
      style={StyleSheet.absoluteFill}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  table: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
