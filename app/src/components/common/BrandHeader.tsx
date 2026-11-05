import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';

interface BrandHeaderProps {
  subtitle?: string;
}

export function BrandHeader({ subtitle = 'Sua hidratação, sob controle.' }: BrandHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.logo, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name="water" size={44} color="#fff" />
      </View>
      <Text style={[styles.name, { color: colors.navy }]}>Drink To You</Text>
      <Text style={{ color: colors.muted }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 30, fontWeight: '800' },
});
