/**
 * Content API: articles, videos (parent resources), activities (kids).
 * Public GET only; admin uses /admin/content.
 */

import { apiClient } from '../lib/apiClient';

export type ContentType = 'article' | 'video' | 'activity';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  video_url: string | null;
  age_range: string | null;
  tags: string[];
  psychology_basis: string[];
  for_parents_notes: string | null;
  evidence_notes: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchContentList(params?: {
  type?: ContentType;
  age_range?: string;
}): Promise<ContentItem[]> {
  const { data } = await apiClient.get<{ items: ContentItem[] }>('/content', { params });
  return data.items ?? [];
}

export async function fetchContentItem(id: string): Promise<ContentItem | null> {
  try {
    const { data } = await apiClient.get<{ item: ContentItem }>(`/content/${id}`);
    return data.item ?? null;
  } catch (err) {
    if (err && typeof err === 'object' && 'response' in err) {
      const res = (err as { response?: { status?: number } }).response;
      if (res?.status === 404) return null;
    }
    throw err;
  }
}
