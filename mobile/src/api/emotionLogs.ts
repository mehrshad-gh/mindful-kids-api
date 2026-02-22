/**
 * Save emotion selection to the backend.
 * Set API_BASE_URL in env or pass baseUrl.
 */

const getBaseUrl = () => {
  // @ts-ignore - process.env for React Native (Expo) / env config
  return process.env.EXPO_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000/api';
};

export interface SaveEmotionOptions {
  emotionId: string;
  childId?: string | null;
  token?: string | null;
  baseUrl?: string;
}

export async function saveEmotionToBackend(options: SaveEmotionOptions): Promise<void> {
  const { emotionId, childId, token, baseUrl = getBaseUrl() } = options;
  const url = `${baseUrl}/emotion-logs`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      emotion_id: emotionId,
      ...(childId ? { child_id: childId } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Save failed: ${res.status}`);
  }
}
