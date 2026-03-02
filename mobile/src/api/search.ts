/**
 * Phase 3 Global Discovery – public search (no auth required).
 */

import { apiClient } from '../lib/apiClient';

export interface SearchTherapistItem {
  id: string;
  name: string;
  specialty: string | null;
  country: string | null;
  verified_status: string;
  verified_at: string | null;
  clinic_names: string[];
  profile_image_url: string | null;
}

export interface SearchClinicItem {
  id: string;
  name: string;
  country: string | null;
  verification_status: string | null;
  verified_at: string | null;
  therapist_count: number;
  website: string | null;
  logo_url: string | null;
}

export interface SearchTherapistsParams {
  country?: string;
  language?: string;
  specialty?: string;
  verified_only?: boolean;
  clinic_id?: string;
  limit?: number;
  offset?: number;
}

export interface SearchClinicsParams {
  country?: string;
  verified_only?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchTherapists(
  params?: SearchTherapistsParams
): Promise<{ therapists: SearchTherapistItem[] }> {
  const { data } = await apiClient.get<{ therapists: SearchTherapistItem[] }>('/search/therapists', {
    params: params ?? {},
  });
  return data;
}

export async function searchClinics(
  params?: SearchClinicsParams
): Promise<{ clinics: SearchClinicItem[] }> {
  const { data } = await apiClient.get<{ clinics: SearchClinicItem[] }>('/search/clinics', {
    params: params ?? {},
  });
  return data;
}
