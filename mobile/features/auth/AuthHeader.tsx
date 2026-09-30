import { StyleSheet, View } from 'react-native';

import { LogoMark } from '@/components/brand/Logo';
import { Text } from '@/components/ui';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <LogoMark size={48} />
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text variant="callout" tone="muted">
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginTop: 24, marginBottom: 28 },
  title: { marginTop: 16 },
});
