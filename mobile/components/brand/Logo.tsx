import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from '../ui/Text';

/**
 * Mneme mark: an ink tile holding two stacked "memory" strokes and an amber
 * spark — captured thoughts, lit up by AI.
 */
export function LogoMark({ size = 56 }: { size?: number }) {
  const { colors } = useTheme();
  const unit = size / 8;
  return (
    <View
      accessibilityLabel="Mneme logo"
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.primary },
      ]}
    >
      <View style={{ gap: unit * 0.7 }}>
        <View style={[styles.stroke, { width: unit * 4.2, height: unit * 0.8, borderRadius: unit }]} />
        <View style={[styles.stroke, { width: unit * 3, height: unit * 0.8, borderRadius: unit, opacity: 0.7 }]} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: unit * 1.3,
          right: unit * 1.3,
          width: unit * 1.3,
          height: unit * 1.3,
          borderRadius: unit,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <LogoMark size={34} />
      <Text variant="title" style={styles.wordmarkText}>
        mneme
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  stroke: { backgroundColor: '#FFFFFF' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { letterSpacing: -0.8 },
});
