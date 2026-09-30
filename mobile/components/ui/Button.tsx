import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  testID,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const inactive = disabled || loading;

  const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.textOnPrimary },
    secondary: { bg: colors.surface, pressed: colors.surfaceMuted, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', pressed: colors.surfaceMuted, fg: colors.primaryText },
    danger: { bg: colors.dangerSoft, pressed: colors.dangerSoft, fg: colors.danger },
  };
  const tone = palette[variant];

  const handlePress = () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={title}
      disabled={inactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          height: size === 'lg' ? 52 : 42,
          borderRadius: radius.md,
          backgroundColor: pressed ? tone.pressed : tone.bg,
          borderWidth: tone.border ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: tone.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Feather name={icon} size={18} color={tone.fg} /> : null}
          <Text variant="bodyStrong" style={{ color: tone.fg }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
