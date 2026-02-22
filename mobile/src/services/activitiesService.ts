import { apiClient } from '../lib/apiClient';

export interface Activity {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  activity_type: string;
  age_groups: string[] | null;
  psychology_basis: string | null;
  for_parents_notes: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_active: boolean;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListActivitiesParams {
  active?: boolean;
  activity_type?: string;
  age_group?: string;
}

export async function fetchActivities(params?: ListActivitiesParams): Promise<Activity[]> {
  const { data } = await apiClient.get<{ activities: Activity[] }>('/activities', { params });
  return data.activities ?? [];
}

export async function fetchActivityById(id: string): Promise<Activity> {
  const { data } = await apiClient.get<{ activity: Activity }>(`/activities/${id}`);
  return data.activity;
}

export async function fetchActivityBySlug(slug: string): Promise<Activity> {
  const { data } = await apiClient.get<{ activity: Activity }>(`/activities/slug/${slug}`);
  return data.activity;
}
