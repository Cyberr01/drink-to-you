import { useEffect, useState } from 'react';
import { SLOW_REQUEST_HINT_MS } from '../config';

/** Indica quando uma operação está demorando mais que o normal (ex.: servidor acordando). */
export function useSlowHint(isLoading: boolean) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_REQUEST_HINT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return isSlow;
}
