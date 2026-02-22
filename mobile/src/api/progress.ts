/**
 * Progress (stars, streak, completions) API.
 * Uses apiClient so the auth token is sent automatically.
 */

import { apiClient } from '../lib/apiClient';

/** Optional activity-specific results (e.g. selected emotion, answers). */
export type ProgressMetadata = Record<string, unknown>;

export interface ProgressSummary {
  child_id: string;
  total_stars: number;
  current_streak: number;
  completed_count: number;
  /** Number of progress records with metadata.selectedEmotion (Emotion Wheel check-ins). */
  emotion_checkin_count?: number;
  /** Most recent emotion check-in: { emotion: string, completed_at: string } or null. */
  last_emotion?: { emotion: string; completed_at: string } | null;
  recent_completions: Array<{
    id: string;
    activity_id: string;
    activity_title: string;
    activity_slug: string;
    stars: number;
    completed_at: string;
    metadata?: ProgressMetadata;
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
  /** Optional activity-specific results. */
  metadata?: ProgressMetadata;
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
  stars: number,
  metadata?: ProgressMetadata
): Promise<ProgressItem> {
  const body: { stars: number; metadata?: ProgressMetadata } = {
    stars: Math.min(5, Math.max(0, stars)),
  };
  if (metadata != null && Object.keys(metadata).length > 0) {
    body.metadata = metadata;
  }
  const { data } = await apiClient.put<{ progress: ProgressItem }>(
    `/progress/children/${childId}/activities/${activityId}`,
    body
  );
  return data.progress;
}

export interface RecordProgressPostBody {
  child_id: string;
  activity_id: string;
  stars?: number;
  metadata?: ProgressMetadata;
  completed_at?: string;
}

/**
 * POST /progress — record completion with child_id, activity_id, metadata (e.g. selectedEmotion), and timestamp.
 * Use for Emotion Wheel and other flows that send full payload. Throws on API errors.
 */
export async function recordProgressViaPost(
  childId: string,
  activityId: string,
  stars: number,
  metadata?: ProgressMetadata
): Promise<ProgressItem> {
  const body: RecordProgressPostBody = {
    child_id: childId,
    activity_id: activityId,
    stars: Math.min(5, Math.max(0, stars)),
    completed_at: new Date().toISOString(),
  };
  if (metadata != null && Object.keys(metadata).length > 0) {
    body.metadata = metadata;
  }
  const { data } = await apiClient.post<{ progress: ProgressItem }>('/progress', body);
  return data.progress;
}
