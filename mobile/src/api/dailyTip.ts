/**
 * Daily tip API – today’s parenting tip (rotating), record viewed.
 */

import { apiClient } from '../lib/apiClient';

export interface DailyTip {
  title: string;
  content: string;
  psychology_basis: string | null;
  domain_id?: string | null;
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

/** Suggested activity and article based on today's tip psychology_basis. */
export interface DailyTipSuggestion {
  id: string;
  type: 'activity' | 'article';
  title: string;
  summary: string | null;
  age_range: string | null;
}

/** Kid tool (Activity) suggested by tip's domain_id for "practice this skill". */
export interface DailyTipSuggestedTool {
  id: string;
  title: string;
  slug: string;
  domain_id: string;
}

export interface DailyTipSuggestionsResponse {
  suggested_activity: DailyTipSuggestion | null;
  suggested_article: DailyTipSuggestion | null;
  suggested_tool?: DailyTipSuggestedTool | null;
}

export async function fetchDailyTipSuggestions(): Promise<DailyTipSuggestionsResponse> {
  const { data } = await apiClient.get<DailyTipSuggestionsResponse>('/daily-tip/suggestions');
  return data;
}
