import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Wordmark } from '@/components/brand/Logo';
import { Button, Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const PILLARS: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  { icon: 'inbox', title: 'Capture anything', body: 'Notes, tasks, voice, photos and PDFs in one place.' },
  { icon: 'search', title: 'Find it by meaning', body: 'Search the way you remember, not the way you filed it.' },
  { icon: 'zap', title: 'Think with AI', body: 'Ask questions and get answers grounded in your own notes.' },
];

export default function WelcomeScreen() {
  const { colors, radius } = useTheme();
  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.hero}>
        <Wordmark />
        <Text variant="display" style={styles.headline}>
          Your personal{'\n'}AI second brain.
        </Text>
        <Text variant="body" tone="muted">
          Dump everything in. Get it back exactly when you need it — organised, searchable and understood.
        </Text>
      </View>

      <View style={styles.pillars}>
        {PILLARS.map((pillar) => (
          <View key={pillar.title} style={styles.pillar}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
              <Feather name={pillar.icon} size={18} color={colors.primaryText} />
            </View>
            <View style={styles.pillarText}>
              <Text variant="bodyStrong">{pillar.title}</Text>
              <Text variant="callout" tone="muted">
                {pillar.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button testID="welcome-sign-up" title="Get started" onPress={() => router.push('/sign-up')} />
        <Button
          testID="welcome-sign-in"
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingBottom: 24 },
  hero: { gap: 16, marginTop: 40 },
  headline: { marginTop: 24 },
  pillars: { gap: 18, marginVertical: 36 },
  pillar: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  pillarIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  pillarText: { flex: 1, gap: 2 },
  actions: { gap: 8 },
});
