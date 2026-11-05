import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';
import { WeeklySummary } from '../../types';
import { formatMl, weekdayInitial } from '../../utils/format';

const CHART_HEIGHT = 110;
const MIN_BAR_HEIGHT = 6;

export function WeeklyChart({ weekly }: { weekly: WeeklySummary }) {
  const { colors } = useAppTheme();
  const maxValue = Math.max(weekly.goal_ml, ...weekly.days.map((day) => day.total_ml));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.navy }]}>Últimos 7 dias</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Média {formatMl(weekly.average_ml)}</Text>
      </View>
      <View style={styles.bars}>
        {weekly.days.map((day, index) => {
          const isToday = index === weekly.days.length - 1;
          const height = Math.max((day.total_ml / maxValue) * CHART_HEIGHT, MIN_BAR_HEIGHT);
          return (
            <View key={day.date} style={styles.barColumn}>
              <View
                style={{
                  height,
                  width: '100%',
                  borderRadius: radius.md / 2,
                  backgroundColor: day.goal_reached ? colors.success : colors.accent,
                  opacity: day.total_ml === 0 ? 0.25 : isToday ? 1 : 0.75,
                }}
              />
              <Text
                style={[styles.dayLabel, { color: isToday ? colors.navy : colors.muted }]}
              >
                {weekdayInitial(day.date)}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: spacing.sm }}>
        Barras verdes indicam dias em que a meta foi atingida.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 24,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  dayLabel: { marginTop: 6, fontSize: 12, fontWeight: '700' },
});
