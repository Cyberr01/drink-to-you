import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export interface AppColors {
  navy: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
}

export const lightColors: AppColors = {
  navy: '#102b46',
  primary: '#176b9b',
  accent: '#20b9cf',
  background: '#f3f7fb',
  surface: '#ffffff',
  surfaceAlt: '#e8f4fa',
  text: '#243447',
  muted: '#617386',
  border: '#dce6ef',
  danger: '#d64545',
  success: '#2e9e6b',
};

export const darkColors: AppColors = {
  navy: '#e6f1fa',
  primary: '#20b9cf',
  accent: '#3fd0e4',
  background: '#0b1c2c',
  surface: '#12293f',
  surfaceAlt: '#183552',
  text: '#e6f1fa',
  muted: '#8ba3b8',
  border: '#1f3b55',
  danger: '#ff7a7a',
  success: '#4cc790',
};

export function buildPaperTheme(colors: AppColors, isDark: boolean) {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.text,
      outline: colors.border,
      error: colors.danger,
    },
  };
}
