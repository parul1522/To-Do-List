import { StyleSheet, View } from 'react-native';

import { Card, Screen, Section, SegmentedControl, Text } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore, type ThemePreference } from '@/store/preferencesStore';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceScreen() {
  const { colors, radius } = useTheme();
  const preference = usePreferencesStore((s) => s.themePreference);
  const setPreference = usePreferencesStore((s) => s.setThemePreference);

  return (
    <Screen edges={[]}>
      <Section title="Theme" grouped={false} footer="System follows your device's light or dark setting.">
        <SegmentedControl
          accessibilityLabel="Theme"
          options={OPTIONS}
          value={preference}
          onChange={setPreference}
        />
      </Section>

      <Section title="Preview" grouped={false}>
        <Card style={styles.preview}>
          <Text variant="overline" tone="muted">
            Data Mining · Lecture 4
          </Text>
          <Text variant="heading">Principal Component Analysis</Text>
          <Text variant="callout" tone="muted">
            Project data onto the directions of greatest variance — the eigenvectors of the covariance matrix.
          </Text>
          <View style={styles.tags}>
            {['#college', '#ml'].map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primarySoft, borderRadius: radius.pill }]}>
                <Text variant="caption" tone="primary">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { padding: 16, gap: 6 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3 },
});
