import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const CONTAINERS: { amount: number; label: string; icon: IconName }[] = [
  { amount: 150, label: 'Copo P', icon: 'cup-outline' },
  { amount: 250, label: 'Copo M', icon: 'cup-water' },
  { amount: 500, label: 'Garrafa', icon: 'bottle-soda-classic-outline' },
];

interface QuickAddButtonsProps {
  disabled?: boolean;
  onAdd: (amountMl: number) => void;
  onCustom: () => void;
}

function BounceButton({
  disabled,
  highlighted,
  icon,
  title,
  subtitle,
  onPress,
}: {
  disabled?: boolean;
  highlighted?: boolean;
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function animatePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={[styles.flex, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        onPress={animatePress}
        style={[
          styles.button,
          {
            backgroundColor: highlighted ? colors.primary : colors.surface,
            borderColor: highlighted ? colors.primary : colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={highlighted ? '#fff' : colors.accent}
        />
        <Text style={[styles.amount, { color: highlighted ? '#fff' : colors.navy }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: highlighted ? '#ffffffcc' : colors.muted }]}>
          {subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuickAddButtons({ disabled, onAdd, onCustom }: QuickAddButtonsProps) {
  return (
    <View style={styles.row}>
      {CONTAINERS.map((item) => (
        <BounceButton
          key={item.amount}
          disabled={disabled}
          icon={item.icon}
          title={`${item.amount} ml`}
          subtitle={item.label}
          onPress={() => onAdd(item.amount)}
        />
      ))}
      <BounceButton
        disabled={disabled}
        highlighted
        icon="plus-circle-outline"
        title="Outro"
        subtitle="Livre"
        onPress={onCustom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  button: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  amount: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  subtitle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
});
