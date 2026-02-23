/**
 * Psychologists API. Uses apiClient (token sent if present).
 */

import { apiClient } from '../lib/apiClient';

export interface PsychologistClinic {
  id: string;
  name: string;
  slug?: string;
  role_label?: string | null;
  is_primary?: boolean;
}

export interface PsychologistListItem {
  id: string;
  name: string;
  specialty?: string | null;
  specialization?: string[] | null;
  bio?: string | null;
  rating?: number | null;
  location?: string | null;
  languages?: string[] | null;
  profile_image?: string | null;
  avg_rating?: number;
  review_count?: number;
  is_verified?: boolean;
}

export interface PsychologistDetail extends PsychologistListItem {
  contact_info?: Record<string, unknown> | null;
  email?: string | null;
  phone?: string | null;
  review_count?: number;
  is_verified?: boolean;
  /** Clinic affiliations (from therapist_clinics). */
  clinics?: PsychologistClinic[] | null;
}

export interface PsychologistReview {
  id: string;
  user_id: string;
  psychologist_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string;
}

export interface PsychologistDetailResponse {
  psychologist: PsychologistDetail;
  reviews: PsychologistReview[];
}

export async function fetchPsychologistList(params?: {
  specialization?: string;
  specialty?: string;
  search?: string;
  location?: string;
  min_rating?: number;
  limit?: number;
}): Promise<PsychologistListItem[]> {
  const { data } = await apiClient.get<{ psychologists: PsychologistListItem[] }>('/psychologists', {
    params,
  });
  return data.psychologists ?? [];
}

export async function fetchPsychologistById(id: string): Promise<PsychologistDetailResponse | null> {
  try {
    const { data } = await apiClient.get<PsychologistDetailResponse>(`/psychologists/${id}`);
    return data ?? null;
  } catch (err) {
    if (err && typeof err === 'object' && 'response' in err) {
      const res = (err as { response?: { status?: number } }).response;
      if (res?.status === 404) return null;
    }
    throw err;
  }
}
