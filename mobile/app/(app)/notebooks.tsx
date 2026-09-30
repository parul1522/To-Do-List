import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

/** Temporary development stub: notebooks ship in Phase 2. */
export default function NotebooksScreen() {
  return (
    <Screen edges={[]}>
      <View style={styles.body}>
        <EmptyState
          icon="book"
          title="Notebooks, nested your way"
          message="Group notes into notebooks like School › Data Mining or Personal › Travel, each with its own colour and icon."
        />
        <Text variant="caption" tone="subtle" align="center">
          Arrives in Phase 2
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 24 },
});
