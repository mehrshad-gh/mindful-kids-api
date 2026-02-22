import { useState, useEffect, useCallback } from 'react';
import { fetchProgressSummary, type ProgressSummary } from '../api/progress';

export function useProgressSummary(
  childId: string | null,
  token: string | null | undefined
) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!childId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProgressSummary(childId, token);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [childId, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
