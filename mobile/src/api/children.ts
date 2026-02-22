const getBaseUrl = () => {
  // @ts-expect-error env
  return process.env.EXPO_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000/api';
};

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

export async function fetchChildren(
  token: string | null | undefined,
  baseUrl?: string
): Promise<ChildItem[]> {
  const res = await fetch(`${baseUrl ?? getBaseUrl()}/children`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.json().then((b) => b.error).catch(() => res.statusText));
  const data = await res.json();
  return data.children ?? [];
}
