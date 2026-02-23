/**
 * Advice API. Uses apiClient (token sent if present).
 */

import { apiClient } from '../lib/apiClient';

export interface AdviceItem {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  psychology_basis?: string | null;
  age_range?: string | null;
  related_activity_id?: string | null;
  is_daily?: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export async function fetchDailyAdvice(): Promise<AdviceItem | null> {
  try {
    const { data } = await apiClient.get<{ advice: AdviceItem }>('/advice/daily');
    return data.advice ?? null;
  } catch (err) {
    if (err && typeof err === 'object' && 'response' in err) {
      const res = (err as { response?: { status?: number } }).response;
      if (res?.status === 404) return null;
    }
    throw err;
  }
}

export async function fetchAdviceList(params?: { category?: string; limit?: number; daily_only?: boolean }): Promise<AdviceItem[]> {
  const { data } = await apiClient.get<{ advice: AdviceItem[] }>('/advice', { params });
  return data.advice ?? [];
}

/**
 * Featured daily advice: use /daily if available, otherwise most recent from list.
 */
export async function fetchFeaturedAdvice(): Promise<AdviceItem | null> {
  const daily = await fetchDailyAdvice();
  if (daily) return daily;
  const list = await fetchAdviceList({ limit: 1 });
  return list[0] ?? null;
}
