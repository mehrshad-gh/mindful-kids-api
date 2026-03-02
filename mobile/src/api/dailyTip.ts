/**
 * Daily tip API – today’s parenting tip (rotating), record viewed.
 */

import { apiClient } from '../lib/apiClient';

export interface DailyTip {
  title: string;
  content: string;
  psychology_basis: string | null;
  viewed_today?: boolean;
}

export async function fetchDailyTip(): Promise<{ tip: DailyTip; viewed_today?: boolean }> {
  const { data } = await apiClient.get<{ tip: DailyTip }>('/daily-tip');
  return { tip: data.tip, viewed_today: data.tip.viewed_today };
}

/** Call when the user opens the tip (detail/modal). Requires auth. */
export async function recordDailyTipViewed(): Promise<void> {
  await apiClient.post('/daily-tip/viewed');
}
