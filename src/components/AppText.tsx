import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { colors, MAX_FONT_MULTIPLIER, typography, TypographyVariant } from '../theme';
import { useResponsive } from '../utils/responsive';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Every piece of text goes through here: responsive size, capped font scaling, design-system fonts. */
export const AppText: React.FC<Props> = ({ variant = 'bodyMd', color = colors.neutral, style, ...rest }) => {
  const { font } = useResponsive();
  const t = typography[variant];
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
      {...rest}
      style={[
        {
          color,
          fontFamily: t.fontFamily,
          fontWeight: t.fontWeight,
          fontSize: font(t.fontSize),
          lineHeight: font(t.lineHeight),
          letterSpacing: t.letterSpacing,
        },
        style,
      ]}
    />
  );
};
