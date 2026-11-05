import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { IosInstallBanner } from '../../components/common/IosInstallBanner';
import { StateMessage } from '../../components/common/StateMessage';
import { ProgressRing } from '../../components/dashboard/ProgressRing';
import { StatCard } from '../../components/dashboard/StatCard';
import { WeatherCard } from '../../components/dashboard/WeatherCard';
import { WeeklyChart } from '../../components/dashboard/WeeklyChart';
import { AddAmountDialog } from '../../components/water/AddAmountDialog';
import { QuickAddButtons } from '../../components/water/QuickAddButtons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWaterSummary } from '../../hooks/useWaterSummary';
import { useWeather } from '../../hooks/useWeather';
import { MainTabParamList } from '../../navigation/types';
import { achievementService } from '../../services/achievementService';
import { feedback } from '../../services/feedback';
import { radius, spacing } from '../../theme/layout';
import {
  firstName,
  formatLongDate,
  formatMl,
  greetingForNow,
  motivationalMessage,
} from '../../utils/format';

export function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { today, weekly, isLoading, error, reload, addEntry, undoEntry } = useWaterSummary();
  const weather = useWeather();

  const [levelInfo, setLevelInfo] = useState<{
    levelNumber: number;
    unlockedCount: number;
    totalCount: number;
  } | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [lastEntryId, setLastEntryId] = useState<number | null>(null);

  const loadLevelSummary = useCallback(async () => {
    try {
      const ach = await achievementService.list();
      setLevelInfo({
        levelNumber: ach.level.number,
        unlockedCount: ach.unlocked_count,
        totalCount: ach.total_count,
      });
    } catch {
      // Silencioso caso falhe secundariamente
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      loadLevelSummary();
    }, [reload, loadLevelSummary]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([reload(), weather.reload(), loadLevelSummary()]);
    setIsRefreshing(false);
  }

  async function handleQuickAdd(amountMl: number) {
    setIsSaving(true);
    try {
      const created = await addEntry({ amount_ml: amountMl });
      setLastEntryId(created.id);
      setSnackbarMessage(`+${formatMl(amountMl)} registrados! 💧`);
      loadLevelSummary();
    } catch (caught) {
      feedback.warning();
      setLastEntryId(null);
      setSnackbarMessage(caught instanceof Error ? caught.message : 'Erro ao registrar.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCustomAdd(amountMl: number, note: string) {
    const created = await addEntry({ amount_ml: amountMl, note: note || null });
    setIsDialogVisible(false);
    setLastEntryId(created.id);
    setSnackbarMessage(`+${formatMl(amountMl)} registrados! 💧`);
    loadLevelSummary();
  }

  async function handleUndo() {
    if (!lastEntryId) return;
    const idToRemove = lastEntryId;
    setLastEntryId(null);
    try {
      await undoEntry(idToRemove);
      setSnackbarMessage('Último registro desfeito.');
      loadLevelSummary();
    } catch {
      setSnackbarMessage('Não foi possível desfazer.');
    }
  }

  if (isLoading && !today) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error && !today) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          icon="wifi-off"
          title="Não foi possível carregar"
          description={error}
          actionLabel="Tentar novamente"
          onAction={reload}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <IosInstallBanner />

        {/* Header Premium em Gradiente */}
        <LinearGradient
          colors={['#102B46', '#176B9B', '#20B9CF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerTop}>
            <View style={styles.flex}>
              <Text style={styles.greeting}>
                {greetingForNow()}, {firstName(user?.name ?? '')}! 👋
              </Text>
              <Text style={styles.dateText}>{formatLongDate()}</Text>
            </View>
            {today ? (
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={18} color="#FF9800" />
                <Text style={styles.streakText}>{today.streak_days}d</Text>
              </View>
            ) : null}
          </View>

          {levelInfo ? (
            <Pressable
              onPress={() => navigation.navigate('Achievements')}
              style={styles.levelBanner}
            >
              <MaterialCommunityIcons name="medal" size={18} color="#FFD54F" />
              <Text style={styles.levelBannerText}>
                Nível {levelInfo.levelNumber} · {levelInfo.unlockedCount}/{levelInfo.totalCount}{' '}
                conquistas
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </LinearGradient>

        {today ? (
          <>
            <View style={styles.ring}>
              <ProgressRing
                progress={today.progress}
                consumedMl={today.consumed_ml}
                goalMl={today.goal_ml}
              />
              <Text style={[styles.message, { color: colors.text }]}>
                {motivationalMessage(today.progress, today.remaining_ml)}
              </Text>
            </View>

            {today.progress >= 1 ? (
              <Pressable
                onPress={() => navigation.navigate('Challenges')}
                style={[styles.celebrationCard, { backgroundColor: `${colors.success}1C`, borderColor: colors.success }]}
              >
                <MaterialCommunityIcons name="party-popper" size={26} color={colors.success} />
                <View style={styles.flex}>
                  <Text style={[styles.celebrationTitle, { color: colors.success }]}>
                    Meta diária concluída!
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 12 }}>
                    Participa de um desafio? Toque aqui e faça seu check-in com foto (+1 ponto)!
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <View style={styles.statRow}>
              <StatCard
                icon="flag-checkered"
                label="Faltam hoje"
                value={formatMl(today.remaining_ml)}
              />
              <StatCard
                icon="fire"
                label="Sua sequência"
                value={`${today.streak_days} ${today.streak_days === 1 ? 'dia' : 'dias'}`}
              />
            </View>
          </>
        ) : null}

        <Text style={[styles.section, { color: colors.navy }]}>Registrar água</Text>
        <QuickAddButtons
          disabled={isSaving}
          onAdd={handleQuickAdd}
          onCustom={() => setIsDialogVisible(true)}
        />

        {/* Atalho Engajador para Desafios */}
        <Pressable
          onPress={() => navigation.navigate('Challenges')}
          style={[styles.challengePromo, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.promoIcon, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="trophy" size={24} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.promoTitle, { color: colors.navy }]}>
              Salas de Desafio & Chama em Dupla 🔥
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Compita com colegas, faça check-in com foto e suba no ranking!
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>

        <Text style={[styles.section, { color: colors.navy }]}>Clima agora</Text>
        <WeatherCard
          weather={weather.data}
          isLoading={weather.isLoading}
          error={weather.error}
          onRetry={weather.reload}
        />

        {weekly ? (
          <>
            <Text style={[styles.section, { color: colors.navy }]}>Sua semana</Text>
            <WeeklyChart weekly={weekly} />
          </>
        ) : null}
      </ScrollView>

      <AddAmountDialog
        visible={isDialogVisible}
        onDismiss={() => setIsDialogVisible(false)}
        onConfirm={handleCustomAdd}
      />
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => {
          setSnackbarMessage(null);
          setLastEntryId(null);
        }}
        duration={4000}
        action={
          lastEntryId
            ? {
                label: 'Desfazer',
                onPress: handleUndo,
              }
            : undefined
        }
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  dateText: { color: '#ffffffcc', fontSize: 13, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00000030',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  streakText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  levelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: '#ffffff20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  levelBannerText: { color: '#fff', fontWeight: '700', fontSize: 12, flex: 1 },
  ring: { alignItems: 'center', marginVertical: spacing.lg },
  message: { marginTop: spacing.md, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  celebrationTitle: { fontSize: 15, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: spacing.md },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  challengePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: { fontSize: 14, fontWeight: '800' },
});
