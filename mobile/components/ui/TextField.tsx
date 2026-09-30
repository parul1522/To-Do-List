import { Feather } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, secureTextEntry, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecret = Boolean(secureTextEntry);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          { borderColor, borderRadius: radius.md, backgroundColor: colors.surface },
          focused && { borderWidth: 1.5 },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          secureTextEntry={isSecret && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, typography.body, { color: colors.text }, style]}
          {...rest}
        />
        {isSecret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={10}
            onPress={() => setRevealed((v) => !v)}
            style={styles.trailing}
          >
            <Feather name={revealed ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 52 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  trailing: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
});
