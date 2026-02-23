/**
 * Reviews API. Requires auth (token sent via apiClient).
 */

import { apiClient } from '../lib/apiClient';

export interface ReviewItem {
  id: string;
  user_id: string;
  psychologist_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string;
}

export async function submitReview(
  psychologistId: string,
  rating: number,
  comment: string | null
): Promise<ReviewItem> {
  const { data } = await apiClient.post<{ review: ReviewItem }>('/reviews', {
    psychologist_id: psychologistId,
    rating,
    comment: comment || null,
  });
  return data.review;
}
