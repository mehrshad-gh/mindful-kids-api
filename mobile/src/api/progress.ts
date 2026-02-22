/**
 * Progress (stars, streak, completions) API.
 * Base URL: EXPO_PUBLIC_API_URL or API_BASE_URL or http://localhost:3000/api
 */

const getBaseUrl = () => {
  // @ts-expect-error env
  return process.env.EXPO_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000/api';
};

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

function headers(token: string | null | undefined) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchProgressList(
  childId: string,
  token: string | null | undefined,
  baseUrl?: string
): Promise<ProgressItem[]> {
  const res = await fetch(`${baseUrl ?? getBaseUrl()}/progress/children/${childId}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(await res.json().then((b) => b.error).catch(() => res.statusText));
  const data = await res.json();
  return data.progress ?? [];
}

export async function fetchProgressSummary(
  childId: string,
  token: string | null | undefined,
  baseUrl?: string
): Promise<ProgressSummary> {
  const res = await fetch(`${baseUrl ?? getBaseUrl()}/progress/children/${childId}/summary`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(await res.json().then((b) => b.error).catch(() => res.statusText));
  return res.json();
}

export async function fetchStreak(
  childId: string,
  token: string | null | undefined,
  baseUrl?: string
): Promise<number> {
  const res = await fetch(`${baseUrl ?? getBaseUrl()}/progress/children/${childId}/streak`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(await res.json().then((b) => b.error).catch(() => res.statusText));
  const data = await res.json();
  return data.current_streak ?? 0;
}

export async function recordProgress(
  childId: string,
  activityId: string,
  stars: number,
  token: string | null | undefined,
  baseUrl?: string
): Promise<ProgressItem> {
  const url = `${baseUrl ?? getBaseUrl()}/progress/children/${childId}/activities/${activityId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ stars: Math.min(5, Math.max(0, stars)) }),
  });
  if (!res.ok) throw new Error(await res.json().then((b) => b.error).catch(() => res.statusText));
  const data = await res.json();
  return data.progress;
}
