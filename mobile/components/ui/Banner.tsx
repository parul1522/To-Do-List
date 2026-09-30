import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

export function Banner({ message, tone = 'danger' }: { message: string; tone?: 'danger' | 'info' }) {
  const { colors, radius } = useTheme();
  const bg = tone === 'danger' ? colors.dangerSoft : colors.primarySoft;
  const fg = tone === 'danger' ? colors.danger : colors.primaryText;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: bg, borderRadius: radius.md }]}
    >
      <Feather name={tone === 'danger' ? 'alert-circle' : 'info'} size={16} color={fg} />
      <Text variant="callout" style={[styles.text, { color: fg }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'flex-start' },
  text: { flex: 1 },
});
