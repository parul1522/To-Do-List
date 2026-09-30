import { Feather } from '@expo/vector-icons';
import { Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: 'default' | 'muted' | 'primary';
  filled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  tone = 'default',
  filled = false,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const color = tone === 'primary' ? colors.primaryText : tone === 'muted' ? colors.textMuted : colors.text;
  const box = size + 20;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed || filled ? colors.surfaceMuted : 'transparent',
        },
        style,
      ]}
    >
      <Feather name={icon} size={size} color={color} />
    </Pressable>
  );
}
