import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { CREATE_ACTIONS, CreateSheet, type CreateAction } from './CreateSheet';

/** Height of the bottom tab bar content, used to float the FAB above it. */
export const TAB_BAR_HEIGHT = 60;

export function CreateFab({ bottomInset }: { bottomInset: number }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSelect = (action: CreateAction) => {
    setOpen(false);
    // Phase 1 development stub: creation flows land with their features.
    const spec = CREATE_ACTIONS.find((a) => a.key === action);
    const message = `${spec?.label ?? 'This'} capture arrives in Phase ${spec?.availableIn ?? '2'}.`;
    if (Platform.OS === 'web') globalThis.alert?.(message);
    else Alert.alert('Coming soon', message);
  };

  return (
    <>
      <Pressable
        testID="create-fab"
        accessibilityRole="button"
        accessibilityLabel="Create"
        onPress={() => {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: bottomInset + TAB_BAR_HEIGHT + 16,
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            shadowColor: colors.primary,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={26} color={colors.textOnPrimary} />
      </Pressable>
      <CreateSheet visible={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
