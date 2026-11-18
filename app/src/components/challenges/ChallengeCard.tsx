import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';
import { ChallengeStatus, ChallengeSummary } from '../../types';
import { formatMl } from '../../utils/format';

interface ChallengeCardProps {
  challenge: ChallengeSummary;
  onPress: () => void;
}

/** Cartão de resumo de uma sala de desafio na listagem principal. */
export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const { colors } = useAppTheme();

  const statusMap: Record<ChallengeStatus, { label: string; color: string }> = {
    active: { label: 'Em andamento', color: colors.success },
    upcoming: { label: 'Em breve', color: colors.accent },
    finished: { label: 'Encerrado', color: colors.muted },
  };
  const statusInfo = statusMap[challenge.status];
  const membersLabel = challenge.members_count === 2 ? 'em dupla' : 'membros';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.navy }]}>{challenge.name}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            Código <Text style={[styles.code, { color: colors.primary }]}>{challenge.code}</Text> ·
            Meta {formatMl(challenge.daily_goal_ml)}/dia
          </Text>
        </View>
        <View style={styles.flamePill}>
          <MaterialCommunityIcons name="fire" size={18} color="#FF7043" />
          <Text style={styles.flameText}>{challenge.collective_streak}d</Text>
        </View>
      </View>

      {challenge.prize ? (
        <View style={[styles.prizeRow, { backgroundColor: colors.surfaceAlt }]}>
          <MaterialCommunityIcons name="gift-outline" size={16} color={colors.primary} />
          <Text style={[styles.prizeText, { color: colors.text }]} numberOfLines={1}>
            Prêmio: {challenge.prize}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          ● {statusInfo.label} ({challenge.members_count} {membersLabel})
        </Text>
        <Text
          style={[
            styles.ctaText,
            { color: challenge.checked_in_today ? colors.success : colors.primary },
          ]}
        >
          {challenge.checked_in_today
            ? `✓ Hoje pago (${challenge.my_points} pts)`
            : `${challenge.my_points} pts · Fazer check-in →`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12 },
  code: { fontWeight: '800' },
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF704320',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  flameText: { color: '#FF5722', fontWeight: '800', fontSize: 13 },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  prizeText: { fontSize: 12, flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  ctaText: { fontSize: 12, fontWeight: '800' },
});
