import { apiClient } from '../lib/apiClient';

export interface ChildItem {
  id: string;
  parent_id: string;
  name: string;
  birth_date: string | null;
  age_group: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChildPayload {
  name: string;
  birth_date?: string | null;
  age_group?: string | null;
}

export async function fetchChildren(): Promise<ChildItem[]> {
  const { data } = await apiClient.get<{ children: ChildItem[] }>('/children');
  return data.children ?? [];
}

export async function createChild(payload: CreateChildPayload): Promise<ChildItem> {
  const { data } = await apiClient.post<{ child: ChildItem }>('/children', payload);
  return data.child;
}

export async function deleteChild(childId: string): Promise<void> {
  await apiClient.delete(`/children/${childId}`);
}
