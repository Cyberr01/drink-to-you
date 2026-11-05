import { StyleSheet } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { md: 14, lg: 22, pill: 999 };

export const sharedStyles = StyleSheet.create({
  screenPadding: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
});
