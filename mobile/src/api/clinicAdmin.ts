/**
 * Clinic admin API – requires authenticated user with role clinic_admin.
 */

import { apiClient } from '../lib/apiClient';

export interface ClinicAdminClinic {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function listMyClinics(): Promise<{ clinics: ClinicAdminClinic[] }> {
  const { data } = await apiClient.get<{ clinics: ClinicAdminClinic[] }>('/clinic-admin/clinics');
  return data;
}

export interface ClinicWithCount {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  address?: string | null;
  country?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  verification_status?: string;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getClinic(clinicId: string): Promise<{
  clinic: ClinicWithCount;
  therapist_count: number;
}> {
  const { data } = await apiClient.get<{ clinic: ClinicWithCount; therapist_count: number }>(
    `/clinic-admin/clinics/${clinicId}`
  );
  return data;
}
