export interface ProgressItem {
  id: string;
  child_id: string;
  activity_id: string;
  stars: number;
  completed_at: string;
  streak_days?: number;
  metadata?: Record<string, unknown>;
  activity_title?: string;
  activity_slug?: string;
}

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
