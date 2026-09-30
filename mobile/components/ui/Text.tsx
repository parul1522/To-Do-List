import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors, TypographyVariant } from '@/theme/tokens';

type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'accent' | 'danger' | 'success' | 'onPrimary';

const toneToColor: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  subtle: 'textSubtle',
  primary: 'primaryText',
  accent: 'accent',
  danger: 'danger',
  success: 'success',
  onPrimary: 'textOnPrimary',
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[toneToColor[tone]], textAlign: align },
        variant === 'overline' && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
