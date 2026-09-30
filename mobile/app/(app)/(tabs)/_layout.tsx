import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateFab, TAB_BAR_HEIGHT } from '@/components/navigation/CreateFab';
import { useTheme } from '@/hooks/useTheme';

type IconName = keyof typeof Feather.glyphMap;

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'notes', title: 'Notes', icon: 'file-text' },
  { name: 'tasks', title: 'Tasks', icon: 'check-square' },
  { name: 'search', title: 'Search', icon: 'search' },
  { name: 'assistant', title: 'Assistant', icon: 'zap' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryText,
          tabBarInactiveTintColor: colors.textSubtle,
          tabBarLabelStyle: styles.label,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 6,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButtonTestID: `tab-${tab.name}`,
              tabBarIcon: ({ color, size }) => <Feather name={tab.icon} size={size - 2} color={color} />,
            }}
          />
        ))}
      </Tabs>
      <CreateFab bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600' },
});
