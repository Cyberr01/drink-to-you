import { useCallback, useEffect, useState } from 'react';
import { challengeService } from '../services/challengeService';
import { ChallengeDetailsResponse } from '../types';
import { getErrorMessage } from '../utils/errors';

/** Carrega os detalhes de uma sala de desafio, com recarga silenciosa e "puxar para atualizar". */
export function useChallengeDetails(challengeId: number) {
  const [data, setData] = useState<ChallengeDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await challengeService.details(challengeId));
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [challengeId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, isRefreshing, error, reload, refresh };
}
