import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage, ThemeMode } from '../services/storage';
import { AppColors, darkColors, lightColors } from '../theme/colors';

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    storage.getThemeMode().then((saved) => {
      if (saved) setMode(saved);
    });
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    const nextMode: ThemeMode = enabled ? 'dark' : 'light';
    setMode(nextMode);
    storage.setThemeMode(nextMode);
  }, []);

  const value = useMemo(
    () => ({
      colors: mode === 'dark' ? darkColors : lightColors,
      isDark: mode === 'dark',
      setDarkMode,
    }),
    [mode, setDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
