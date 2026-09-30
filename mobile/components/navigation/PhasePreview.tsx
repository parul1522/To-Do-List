import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

interface PhasePreviewProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  headline: string;
  description: string;
  phase: number;
  action?: ReactNode;
}

/**
 * Temporary development stub for tabs whose feature ships in a later phase.
 * It keeps navigation real while being explicit that the feature is not built yet.
 */
export function PhasePreview({ title, icon, headline, description, phase, action }: PhasePreviewProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="display">{title}</Text>
      </View>
      <EmptyState icon={icon} title={headline} message={description} action={action} />
      <Text variant="caption" tone="subtle" align="center">
        Arrives in Phase {phase}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 8 },
});
