import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Visually mark a row whose feature ships in a later release. */
  comingSoon?: boolean;
  trailing?: ReactNode;
  last?: boolean;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  value,
  onPress,
  destructive,
  comingSoon,
  trailing,
  last,
  testID,
}: ListRowProps) {
  const { colors, radius } = useTheme();
  const interactive = Boolean(onPress) && !comingSoon;
  const tint = destructive ? colors.danger : colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              borderRadius: radius.sm,
              backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft,
            },
          ]}
        >
          <Feather name={icon} size={16} color={destructive ? colors.danger : colors.primaryText} />
        </View>
      ) : null}
      <View
        style={[
          styles.body,
          !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
        ]}
      >
        <View style={styles.texts}>
          <Text variant="callout" style={{ color: tint, opacity: comingSoon ? 0.55 : 1 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {comingSoon ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
            <Text variant="caption" tone="muted">
              Soon
            </Text>
          </View>
        ) : null}
        {value ? (
          <Text variant="callout" tone="muted" numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {trailing}
        {interactive && !destructive ? <Feather name="chevron-right" size={18} color={colors.textSubtle} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  iconWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingRight: 14,
    paddingVertical: 10,
    gap: 8,
  },
  texts: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
});
