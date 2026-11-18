import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing } from '../../theme/layout';
import { ChallengeInfo } from '../../types';
import { formatMl } from '../../utils/format';

const HERO_GRADIENT = ['#102B46', '#176B9B', '#20B9CF'] as const;

interface ChallengeHeroProps {
  challenge: ChallengeInfo;
  onShareCode: () => void;
}

/** Cabeçalho da sala: nome, período, código de convite, chama coletiva e prêmio combinado. */
export function ChallengeHero({ challenge, onShareCode }: ChallengeHeroProps) {
  const isDuo = challenge.members_count === 2;
  const dayLabel = challenge.collective_streak === 1 ? 'dia' : 'dias';

  return (
    <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.title}>{challenge.name}</Text>
          <Text style={styles.meta}>
            Meta: {formatMl(challenge.daily_goal_ml)}/dia · {challenge.start_date} até {challenge.end_date}
          </Text>
        </View>
        <Pressable onPress={onShareCode} style={styles.codePill}>
          <MaterialCommunityIcons name="share-variant" size={14} color="#fff" />
          <Text style={styles.codeText}>{challenge.code}</Text>
        </Pressable>
      </View>

      {challenge.description ? <Text style={styles.description}>{challenge.description}</Text> : null}

      <View style={styles.flameBox}>
        <MaterialCommunityIcons name="fire" size={38} color="#FF9800" />
        <View style={styles.flex}>
          <Text style={styles.flameTitle}>
            {challenge.collective_streak} {dayLabel} de Chama {isDuo ? 'da Dupla!' : 'Coletiva!'}
          </Text>
          <Text style={styles.flameSubtitle}>
            Sobe +1 a cada dia em que todos os {challenge.members_count} participantes batem a meta e
            fazem check-in!
          </Text>
        </View>
      </View>

      {challenge.prize ? (
        <View style={styles.prizeBanner}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color="#FFD54F" />
          <Text style={styles.prizeText}>
            Prêmio combinado: {challenge.prize} (acordo entre participantes)
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { color: '#fff', fontSize: 21, fontWeight: '800' },
  meta: { color: '#ffffffdd', fontSize: 12, marginTop: 2 },
  description: { color: '#ffffffea', fontSize: 13, marginTop: spacing.sm },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff28',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  codeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  flameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#00000028',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  flameTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  flameSubtitle: { color: '#ffffffcc', fontSize: 12 },
  prizeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  prizeText: { color: '#FFE082', fontSize: 12, fontWeight: '700', flex: 1 },
});
