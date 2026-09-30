import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default). Disable for screens that manage their own lists. */
  scroll?: boolean;
  /** Avoid the software keyboard (forms). */
  keyboardAware?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  padded?: boolean;
}

export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
  edges = ['top'],
  contentStyle,
  padded = true,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const padding = padded ? { paddingHorizontal: spacing.xl } : null;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
});
