import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/layout';

interface StateMessageProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Mensagem centralizada usada em estados vazios e de erro. */
export function StateMessage({ icon, title, description, actionLabel, onAction }: StateMessageProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.accent} />
      <Text style={[styles.title, { color: colors.navy }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.muted }]}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: spacing.xl },
  title: { fontSize: 18, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  description: { textAlign: 'center', marginTop: spacing.sm },
  button: { marginTop: spacing.md },
});
