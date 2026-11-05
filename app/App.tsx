import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { useAppTheme } from './src/hooks/useAppTheme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { buildPaperTheme } from './src/theme/colors';

function ThemedApp() {
  const { colors, isDark } = useAppTheme();
  return (
    <PaperProvider theme={buildPaperTheme(colors, isDark)}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
