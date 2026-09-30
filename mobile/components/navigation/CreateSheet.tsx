import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

export type CreateAction = 'note' | 'task' | 'checklist' | 'audio' | 'upload' | 'scan';

interface ActionSpec {
  key: CreateAction;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  /** Phase in which the action becomes functional. */
  availableIn: number;
}

export const CREATE_ACTIONS: ActionSpec[] = [
  { key: 'note', label: 'Note', icon: 'edit-3', availableIn: 2 },
  { key: 'task', label: 'Task', icon: 'check-circle', availableIn: 3 },
  { key: 'checklist', label: 'Checklist', icon: 'list', availableIn: 2 },
  { key: 'audio', label: 'Audio note', icon: 'mic', availableIn: 8 },
  { key: 'upload', label: 'Upload file', icon: 'paperclip', availableIn: 3 },
  { key: 'scan', label: 'Scan document', icon: 'camera', availableIn: 8 },
];

interface CreateSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: CreateAction) => void;
}

export function CreateSheet({ visible, onClose, onSelect }: CreateSheetProps) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        accessibilityLabel="Close create menu"
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surfaceRaised,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
        <Text variant="heading" style={styles.title}>
          Capture something
        </Text>
        <View style={styles.grid}>
          {CREATE_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              testID={`create-${action.key}`}
              accessibilityRole="button"
              accessibilityLabel={`New ${action.label}`}
              onPress={() => onSelect(action.key)}
              style={({ pressed }) => [
                styles.tile,
                {
                  borderRadius: radius.lg,
                  backgroundColor: pressed ? colors.primarySoft : colors.surfaceMuted,
                },
              ]}
            >
              <Feather name={action.icon} size={22} color={colors.primaryText} />
              <Text variant="caption" align="center">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: StyleSheet.absoluteFill,
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '30%', flexGrow: 1, aspectRatio: 1.1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
