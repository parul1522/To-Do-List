import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { firstName, greetingFor } from '@/utils/greeting';

const QUICK_ACTIONS: { label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { label: 'New note', icon: 'edit-3' },
  { label: 'New task', icon: 'check-circle' },
  { label: 'Record', icon: 'mic' },
  { label: 'Upload', icon: 'paperclip' },
];

export default function HomeScreen() {
  const { colors, radius } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text variant="callout" tone="muted">
            {greetingFor()}
          </Text>
          <Text variant="display" numberOfLines={1}>
            {firstName(user?.name) || 'there'}
          </Text>
        </View>
        <Pressable
          testID="open-settings"
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push('/settings')}
          hitSlop={8}
        >
          <Avatar name={user?.name} uri={user?.avatar_url} size={44} />
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((action) => (
          <View
            key={action.label}
            style={[styles.quick, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
              <Feather name={action.icon} size={18} color={colors.primaryText} />
            </View>
            <Text variant="caption">{action.label}</Text>
          </View>
        ))}
      </View>
      <Text variant="caption" tone="subtle" style={styles.quickHint}>
        Use the + button to see what you can capture. Notes arrive in Phase 2.
      </Text>

      <Card style={styles.intro}>
        <View style={[styles.spark, { backgroundColor: colors.accentSoft, borderRadius: radius.md }]}>
          <Feather name="zap" size={18} color={colors.accent} />
        </View>
        <View style={styles.introText}>
          <Text variant="bodyStrong">Your second brain is ready</Text>
          <Text variant="callout" tone="muted">
            As you add notes, tasks and files, this space fills with your recent work, today&apos;s tasks and
            suggestions from your assistant.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  greeting: { flex: 1, gap: 2, marginRight: 12 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    opacity: 0.7,
  },
  quickIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  quickHint: { marginTop: 10, marginLeft: 2 },
  intro: { flexDirection: 'row', gap: 14, padding: 16, marginTop: 28 },
  spark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, gap: 4 },
});
