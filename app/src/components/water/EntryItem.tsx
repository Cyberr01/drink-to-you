import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';
import { WaterEntry } from '../../types';
import { formatMl, formatTime } from '../../utils/format';

interface EntryItemProps {
  entry: WaterEntry;
  onPress: (entry: WaterEntry) => void;
}

export function EntryItem({ entry, onPress }: EntryItemProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
        <MaterialCommunityIcons name="cup-water" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.amount, { color: colors.navy }]}>{formatMl(entry.amount_ml)}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
          {formatTime(entry.created_at)}
          {entry.note ? ` · ${entry.note}` : ''}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: spacing.md },
  amount: { fontSize: 16, fontWeight: '700' },
});
