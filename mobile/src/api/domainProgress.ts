/**
 * Domain progress API – emotional skill domains (sessions, stars per domain).
 */

import { apiClient } from '../lib/apiClient';

export interface DomainProgressItem {
  domain_id: string;
  sessions_completed: number;
  total_stars: number;
  last_practiced_at: string | null;
}

export interface DomainProgressResponse {
  domains: DomainProgressItem[];
}

export async function fetchDomainProgress(childId: string): Promise<DomainProgressResponse> {
  const { data } = await apiClient.get<DomainProgressResponse>('/kids/domain-progress', {
    params: { child_id: childId },
  });
  return data;
}
