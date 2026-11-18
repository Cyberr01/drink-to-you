import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';
import { ChallengeRankingItem } from '../../types';

const PODIUM_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function medalFor(position: number) {
  return PODIUM_MEDALS[position] ?? `${position}º`;
}

function litersLabel(totalMl: number) {
  return `${(totalMl / 1000).toFixed(1)}L`;
}

interface RankingRowProps {
  item: ChallengeRankingItem;
  isMe: boolean;
}

/** Linha do ranking com posição, sequência individual, pontos e status do check-in de hoje. */
export function RankingRow({ item, isMe }: RankingRowProps) {
  const { colors } = useAppTheme();
  const todayColor = item.checked_in_today ? colors.success : colors.muted;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: isMe ? colors.accent : colors.border },
      ]}
    >
      <Text style={styles.medal}>{medalFor(item.position)}</Text>
      <View style={styles.flex}>
        <Text style={[styles.name, { color: colors.navy }]}>
          {item.name} {isMe ? '(Você)' : ''}
        </Text>
        <Text style={[styles.details, { color: colors.muted }]}>
          🔥 {item.streak_days}d seguidos · {litersLabel(item.total_verified_ml)} comprovados
        </Text>
      </View>
      <View style={styles.pointsColumn}>
        <Text style={[styles.points, { color: colors.primary }]}>{item.points} pts</Text>
        <Text style={[styles.todayStatus, { color: todayColor }]}>
          {item.checked_in_today ? '✓ Hoje' : 'Pendente'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  medal: { fontSize: 22, width: 34, textAlign: 'center', fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800' },
  details: { fontSize: 12 },
  pointsColumn: { alignItems: 'flex-end' },
  points: { fontSize: 17, fontWeight: '800' },
  todayStatus: { fontSize: 11, fontWeight: '700' },
});
