import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from './Card';
import { Text } from './Text';

interface SectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  /** Render children inside a grouped card (settings style). */
  grouped?: boolean;
}

export function Section({ title, footer, children, grouped = true }: SectionProps) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="overline" tone="muted" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {grouped ? <Card>{children}</Card> : children}
      {footer ? (
        <Text variant="caption" tone="subtle" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8, marginTop: 24 },
  title: { marginLeft: 4 },
  footer: { marginHorizontal: 4 },
});
