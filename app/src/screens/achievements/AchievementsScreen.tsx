import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, ProgressBar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { achievementService } from '../../services/achievementService';
import { radius, spacing } from '../../theme/layout';
import { AchievementItem, AchievementsResponse, AchievementTier } from '../../types';

type FilterType = 'all' | 'unlocked' | 'diamond';

const TIER_COLORS: Record<AchievementTier, { main: string; bg: string }> = {
  bronze: { main: '#C77B30', bg: '#C77B301E' },
  silver: { main: '#20B9CF', bg: '#20B9CF1E' },
  gold: { main: '#E09F1F', bg: '#E09F1F22' },
  diamond: { main: '#7C4DFF', bg: '#7C4DFF22' },
};

export function AchievementsScreen() {
  const { colors } = useAppTheme();
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const load = useCallback(async () => {
    try {
      setData(await achievementService.list());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          icon="wifi-off"
          title="Não foi possível carregar suas conquistas"
          description={error}
          actionLabel="Tentar novamente"
          onAction={load}
        />
      </SafeAreaView>
    );
  }

  const filtered = (data?.achievements ?? []).filter((item) => {
    if (filter === 'unlocked') return item.unlocked;
    if (filter === 'diamond') return item.tier === 'diamond';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {data ? (
          <LinearGradient
            colors={['#102B46', '#176B9B', '#20B9CF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.levelBadge}>
                <MaterialCommunityIcons name="shield-crown" size={28} color="#FFD54F" />
                <View>
                  <Text style={styles.levelNumber}>NÍVEL {data.level.number}</Text>
                  <Text style={styles.levelTitle}>{data.level.title}</Text>
                </View>
              </View>
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>
                  🏅 {data.unlocked_count}/{data.total_count}
                </Text>
              </View>
            </View>

            <ProgressBar
              progress={data.level.progress}
              color="#FFD54F"
              style={styles.xpBar}
            />
            <View style={styles.xpRow}>
              <Text style={styles.xpText}>{data.level.xp} XP acumulados</Text>
              <Text style={styles.xpText}>
                {data.level.next_level_xp
                  ? `Próximo nível: ${data.level.next_level_xp} XP`
                  : 'Nível Máximo Alcançado!'}
              </Text>
            </View>

            <View style={styles.miniStats}>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>
                  {(data.stats.total_ml / 1000).toFixed(1)}L
                </Text>
                <Text style={styles.miniStatLabel}>Total bebido</Text>
              </View>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{data.stats.best_streak}d</Text>
                <Text style={styles.miniStatLabel}>Melhor chama</Text>
              </View>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{data.stats.goal_days}</Text>
                <Text style={styles.miniStatLabel}>Metas batidas</Text>
              </View>
            </View>
          </LinearGradient>
        ) : null}

        <View style={styles.filters}>
          {(
            [
              { key: 'all', label: 'Todas (15)' },
              { key: 'unlocked', label: `Conquistadas (${data?.unlocked_count ?? 0})` },
              { key: 'diamond', label: '💎 Lendárias (3)' },
            ] as { key: FilterType; label: string }[]
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#fff' : colors.text,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filtered.map((item) => (
          <AchievementCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementCard({ item }: { item: AchievementItem }) {
  const { colors } = useAppTheme();
  const palette = TIER_COLORS[item.tier];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: item.unlocked ? palette.main : colors.border,
          opacity: item.unlocked ? 1 : 0.88,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: item.unlocked ? palette.bg : colors.surfaceAlt },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={28}
            color={item.unlocked ? palette.main : colors.muted}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: colors.navy }]}>{item.title}</Text>
            <View style={[styles.tierBadge, { backgroundColor: palette.bg }]}>
              <Text style={[styles.tierText, { color: palette.main }]}>
                {item.tier === 'diamond' ? '💎 ' : ''}
                {item.tier_label}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: colors.muted }]}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <ProgressBar
          progress={item.progress}
          color={item.unlocked ? colors.success : palette.main}
          style={styles.bar}
        />
        <View style={styles.progressMeta}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {item.current.toLocaleString('pt-BR')} / {item.target.toLocaleString('pt-BR')}{' '}
            {item.unit}
          </Text>
          <Text
            style={{
              color: item.unlocked ? colors.success : palette.main,
              fontWeight: '800',
              fontSize: 12,
            }}
          >
            {item.unlocked ? `✓ Conquistada (+${item.xp} XP)` : `+${item.xp} XP`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelNumber: { color: '#FFD54F', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  levelTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  counterPill: {
    backgroundColor: '#ffffff24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  counterText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  xpBar: { height: 8, borderRadius: 4, backgroundColor: '#ffffff30' },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpText: { color: '#ffffffdd', fontSize: 12, fontWeight: '600' },
  miniStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#ffffff26',
  },
  miniStatItem: { flex: 1, alignItems: 'center' },
  miniStatValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  miniStatLabel: { color: '#ffffffcc', fontSize: 11 },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  tierText: { fontSize: 11, fontWeight: '800' },
  cardDesc: { fontSize: 13, marginTop: 4 },
  progressSection: { marginTop: spacing.md },
  bar: { height: 7, borderRadius: 4 },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
