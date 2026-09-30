import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Avatar, ListRow, Screen, Section, Text } from '@/components/ui';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';

const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;

function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const themePreference = usePreferencesStore((s) => s.themePreference);

  return (
    <Screen edges={[]}>
      <ListRowCard>
        <View style={styles.profile}>
          <Avatar name={user?.name} uri={user?.avatar_url} size={56} />
          <View style={styles.profileText}>
            <Text variant="heading" numberOfLines={1}>
              {user?.name}
            </Text>
            <Text variant="callout" tone="muted" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <ListRow
          testID="settings-profile"
          icon="user"
          title="Edit profile"
          onPress={() => router.push('/settings/profile')}
          last
        />
      </ListRowCard>

      <Section title="Account">
        <ListRow
          testID="settings-security"
          icon="lock"
          title="Password & security"
          subtitle="Change password, sign out other devices"
          onPress={() => router.push('/settings/security')}
          last
        />
      </Section>

      <Section title="Preferences">
        <ListRow
          testID="settings-appearance"
          icon="moon"
          title="Appearance"
          value={THEME_LABEL[themePreference]}
          onPress={() => router.push('/settings/appearance')}
        />
        <ListRow icon="bell" title="Notifications" comingSoon />
        <ListRow icon="zap" title="AI settings" comingSoon last />
      </Section>

      <Section title="Data">
        <ListRow icon="hard-drive" title="Storage" comingSoon />
        <ListRow icon="shield" title="Privacy" subtitle="Your notes are private to your account" comingSoon last />
      </Section>

      <Section>
        <ListRow
          testID="settings-sign-out"
          icon="log-out"
          title="Sign out"
          destructive
          onPress={() => confirm('Sign out?', 'You can sign back in at any time.', 'Sign out', () => void signOut())}
          last
        />
      </Section>

      <Text variant="caption" tone="subtle" align="center" style={styles.version}>
        Mneme {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}

function ListRowCard({ children }: { children: ReactNode }) {
  return (
    <Section grouped>
      <View>{children}</View>
    </Section>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  profileText: { flex: 1, gap: 2 },
  version: { marginTop: 28 },
});
