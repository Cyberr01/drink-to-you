import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StateMessage } from '../../components/common/StateMessage';
import { EntryItem } from '../../components/water/EntryItem';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList } from '../../navigation/types';
import { waterService } from '../../services/waterService';
import { spacing } from '../../theme/layout';
import { WaterEntry } from '../../types';
import { formatDayTitle, formatMl, localDayKey } from '../../utils/format';

interface DaySection {
  dayKey: string;
  totalMl: number;
  data: WaterEntry[];
}

function groupByDay(entries: WaterEntry[]): DaySection[] {
  const sections = new Map<string, DaySection>();
  for (const entry of entries) {
    const dayKey = localDayKey(entry.created_at);
    const section = sections.get(dayKey) ?? { dayKey, totalMl: 0, data: [] };
    section.data.push(entry);
    section.totalMl += entry.amount_ml;
    sections.set(dayKey, section);
  }
  return Array.from(sections.values());
}

export function HistoryScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await waterService.list());
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

  const sections = useMemo(() => groupByDay(entries), [entries]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.navy }]}>Histórico</Text>
      {error ? (
        <StateMessage
          icon="wifi-off"
          title="Não foi possível carregar"
          description={error}
          actionLabel="Tentar novamente"
          onAction={load}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.navy }]}>
                {formatDayTitle(section.dayKey)}
              </Text>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>{formatMl(section.totalMl)}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <EntryItem entry={item} onPress={(entry) => navigation.navigate('EntryDetails', { entryId: entry.id })} />
          )}
          ListEmptyComponent={
            <StateMessage
              icon="cup-water"
              title="Nenhum registro ainda"
              description="Volte ao Início e registre seu primeiro copo d’água."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  list: { padding: spacing.md, paddingBottom: spacing.xl, maxWidth: 560, width: '100%', alignSelf: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
});
