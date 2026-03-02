/**
 * Parent streak API – daily-tip viewing streak (current, longest).
 */

import { apiClient } from '../lib/apiClient';

export interface ParentStreak {
  current_streak: number;
  longest_streak: number;
}

export async function fetchParentStreak(): Promise<ParentStreak> {
  const { data } = await apiClient.get<ParentStreak>('/parent/streak');
  return data;
}
