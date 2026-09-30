import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferencesState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

/** Non-sensitive, per-device UI preferences (persisted to AsyncStorage). */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: 'mneme.preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
