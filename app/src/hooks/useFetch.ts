import { useCallback, useEffect, useRef, useState } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** Executa uma requisição assíncrona expondo dados, loading e erro. */
export function useFetch<T>(fetcher: () => Promise<T>): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
