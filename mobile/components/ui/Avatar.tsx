import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { initials } from '@/utils/greeting';

import { Text } from './Text';

export function Avatar({ name, uri, size = 40 }: { name?: string | null; uri?: string | null; size?: number }) {
  const { colors } = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={shape} accessibilityLabel={`${name ?? 'User'} avatar`} />;
  }
  return (
    <View style={[styles.fallback, shape, { backgroundColor: colors.primarySoft }]}>
      <Text style={{ color: colors.primaryText, fontSize: size * 0.38, fontWeight: '700' }}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
