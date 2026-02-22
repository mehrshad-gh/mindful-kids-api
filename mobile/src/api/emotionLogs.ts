/**
 * Save emotion selection to the backend.
 * Uses apiClient so the auth token is sent automatically.
 */

import { apiClient } from '../lib/apiClient';

export interface SaveEmotionOptions {
  emotionId: string;
  childId?: string | null;
}

export async function saveEmotionToBackend(options: SaveEmotionOptions): Promise<void> {
  const { emotionId, childId } = options;
  await apiClient.post('/emotion-logs', {
    emotion_id: emotionId,
    ...(childId ? { child_id: childId } : {}),
  });
}
