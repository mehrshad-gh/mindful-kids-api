import { useState, useEffect, useCallback } from 'react';
import { fetchChildren, createChild as createChildApi, type ChildItem, type CreateChildPayload } from '../api/children';

export function useChildren() {
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchChildren();
      setChildren(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createChild = useCallback(
    async (payload: CreateChildPayload): Promise<ChildItem> => {
      const child = await createChildApi(payload);
      setChildren((prev) => [...prev, child]);
      return child;
    },
    []
  );

  return { children, loading, error, refresh, createChild };
}
