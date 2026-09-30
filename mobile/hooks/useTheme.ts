import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '@/store/preferencesStore';
import { darkTheme, lightTheme, type Theme } from '@/theme/tokens';

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((s) => s.themePreference);
  const scheme = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  return scheme === 'dark' ? darkTheme : lightTheme;
}
