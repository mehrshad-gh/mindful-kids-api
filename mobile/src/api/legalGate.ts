import { apiClient } from '../lib/apiClient';

export interface RequiredAcceptanceItem {
  document_type: string;
  document_version: string;
}

export interface RequiredAcceptancesResponse {
  required: RequiredAcceptanceItem[];
  missing: RequiredAcceptanceItem[];
}

/** GET /auth/me/required-acceptances – required and missing legal acceptances for current user (role-based). */
export async function getRequiredAcceptances(): Promise<RequiredAcceptancesResponse> {
  const { data } = await apiClient.get<RequiredAcceptancesResponse>('/auth/me/required-acceptances');
  return data;
}
