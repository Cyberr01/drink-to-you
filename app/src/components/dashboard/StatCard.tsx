import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
      <Text style={[styles.value, { color: colors.navy }]}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  value: { fontSize: 20, fontWeight: '800', marginTop: spacing.xs },
});
