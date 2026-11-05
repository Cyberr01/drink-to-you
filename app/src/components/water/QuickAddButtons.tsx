import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';

const QUICK_AMOUNTS_ML = [150, 250, 500];

interface QuickAddButtonsProps {
  disabled?: boolean;
  onAdd: (amountMl: number) => void;
  onCustom: () => void;
}

export function QuickAddButtons({ disabled, onAdd, onCustom }: QuickAddButtonsProps) {
  const { colors } = useAppTheme();

  const buttonStyle = (highlighted: boolean) => [
    styles.button,
    {
      backgroundColor: highlighted ? colors.primary : colors.surface,
      borderColor: highlighted ? colors.primary : colors.border,
      opacity: disabled ? 0.6 : 1,
    },
  ];

  return (
    <View style={styles.row}>
      {QUICK_AMOUNTS_ML.map((amount) => (
        <Pressable
          key={amount}
          disabled={disabled}
          style={buttonStyle(false)}
          onPress={() => onAdd(amount)}
          accessibilityLabel={`Adicionar ${amount} mililitros`}
        >
          <MaterialCommunityIcons name="cup-water" size={26} color={colors.accent} />
          <Text style={[styles.amount, { color: colors.text }]}>{amount}</Text>
          <Text style={[styles.unit, { color: colors.muted }]}>ml</Text>
        </Pressable>
      ))}
      <Pressable
        disabled={disabled}
        style={buttonStyle(true)}
        onPress={onCustom}
        accessibilityLabel="Adicionar quantidade personalizada"
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
        <Text style={[styles.amount, { color: '#fff' }]}>Outro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  amount: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  unit: { fontSize: 12 },
});
