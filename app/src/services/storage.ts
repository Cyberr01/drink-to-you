import AsyncStorage from '@react-native-async-storage/async-storage';
import { Preferences } from '../types';

const KEYS = {
  token: '@drinktoyou:token',
  theme: '@drinktoyou:theme',
  preferences: '@drinktoyou:preferences',
  onboardedPrefix: '@drinktoyou:onboarded:',
};

export type ThemeMode = 'light' | 'dark';

export const storage = {
  getToken: () => AsyncStorage.getItem(KEYS.token),
  setToken: (token: string) => AsyncStorage.setItem(KEYS.token, token),
  clearToken: () => AsyncStorage.removeItem(KEYS.token),

  async getThemeMode(): Promise<ThemeMode | null> {
    const value = await AsyncStorage.getItem(KEYS.theme);
    return value === 'light' || value === 'dark' ? value : null;
  },
  setThemeMode: (mode: ThemeMode) => AsyncStorage.setItem(KEYS.theme, mode),

  async getPreferences(): Promise<Preferences | null> {
    const raw = await AsyncStorage.getItem(KEYS.preferences);
    return raw ? (JSON.parse(raw) as Preferences) : null;
  },
  setPreferences: (preferences: Preferences) =>
    AsyncStorage.setItem(KEYS.preferences, JSON.stringify(preferences)),

  async isOnboarded(userId: number) {
    return (await AsyncStorage.getItem(KEYS.onboardedPrefix + userId)) === 'true';
  },
  setOnboarded: (userId: number) => AsyncStorage.setItem(KEYS.onboardedPrefix + userId, 'true'),

  async clearSession() {
    await AsyncStorage.multiRemove([KEYS.token, KEYS.preferences]);
  },
};
