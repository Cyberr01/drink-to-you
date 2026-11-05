import { useCallback, useState } from 'react';
import { feedback } from '../services/feedback';
import { waterService } from '../services/waterService';
import { TodaySummary, WaterEntryInput, WeeklySummary } from '../types';

export function useWaterSummary() {
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [todayData, weeklyData] = await Promise.all([waterService.today(), waterService.weekly()]);
      setToday(todayData);
      setWeekly(weeklyData);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEntry = useCallback(
    async (input: WaterEntryInput) => {
      await waterService.create(input);
      feedback.success();
      await reload();
    },
    [reload],
  );

  return { today, weekly, isLoading, error, reload, addEntry };
}
