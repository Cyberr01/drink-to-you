import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import { feedback } from '../../services/feedback';
import { spacing } from '../../theme/layout';
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
  const { today, weekly, isLoading, error, reload, addEntry } = useWaterSummary();
  const weather = useWeather();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([reload(), weather.reload()]);
    setIsRefreshing(false);
  }

  async function handleQuickAdd(amountMl: number) {
    setIsSaving(true);
    try {
      await addEntry({ amount_ml: amountMl });
      setSnackbarMessage(`+${formatMl(amountMl)} registrados! 💧`);
    } catch (caught) {
      feedback.warning();
      setSnackbarMessage(caught instanceof Error ? caught.message : 'Erro ao registrar.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCustomAdd(amountMl: number, note: string) {
    await addEntry({ amount_ml: amountMl, note: note || null });
    setIsDialogVisible(false);
    setSnackbarMessage(`+${formatMl(amountMl)} registrados! 💧`);
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
        <Text style={[styles.greeting, { color: colors.navy }]}>
          {greetingForNow()}, {firstName(user?.name ?? '')}! 👋
        </Text>
        <Text style={{ color: colors.muted }}>{formatLongDate()}</Text>

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

            <View style={styles.statRow}>
              <StatCard icon="flag-checkered" label="Faltam" value={formatMl(today.remaining_ml)} />
              <StatCard
                icon="fire"
                label="Sequência"
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
      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage(null)} duration={2500}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
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
  greeting: { fontSize: 24, fontWeight: '800' },
  ring: { alignItems: 'center', marginVertical: spacing.lg },
  message: { marginTop: spacing.md, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: spacing.md },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
});
