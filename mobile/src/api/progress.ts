/**
 * Progress (stars, streak, completions) API.
 * Uses apiClient so the auth token is sent automatically.
 */

import { apiClient } from '../lib/apiClient';

export interface ProgressSummary {
  child_id: string;
  total_stars: number;
  current_streak: number;
  completed_count: number;
  recent_completions: Array<{
    id: string;
    activity_id: string;
    activity_title: string;
    activity_slug: string;
    stars: number;
    completed_at: string;
  }>;
}

export interface ProgressItem {
  id: string;
  child_id: string;
  activity_id: string;
  stars: number;
  completed_at: string;
  streak_days?: number;
  activity_title?: string;
  activity_slug?: string;
}

export async function fetchProgressList(childId: string): Promise<ProgressItem[]> {
  const { data } = await apiClient.get<{ progress: ProgressItem[] }>(
    `/progress/children/${childId}`
  );
  return data.progress ?? [];
}

export async function fetchProgressSummary(childId: string): Promise<ProgressSummary> {
  const { data } = await apiClient.get<ProgressSummary>(
    `/progress/children/${childId}/summary`
  );
  return data;
}

export async function fetchStreak(childId: string): Promise<number> {
  const { data } = await apiClient.get<{ current_streak: number }>(
    `/progress/children/${childId}/streak`
  );
  return data.current_streak ?? 0;
}

export async function recordProgress(
  childId: string,
  activityId: string,
  stars: number
): Promise<ProgressItem> {
  const { data } = await apiClient.put<{ progress: ProgressItem }>(
    `/progress/children/${childId}/activities/${activityId}`,
    { stars: Math.min(5, Math.max(0, stars)) }
  );
  return data.progress;
}
