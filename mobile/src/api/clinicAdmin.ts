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
  phone?: string | null;
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

export interface ClinicProfileUpdate {
  name?: string;
  description?: string | null;
  location?: string | null;
  address?: string | null;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
  logo_url?: string | null;
}

/** GET /clinic-admin/clinics/me – get first managed clinic (convenience for single-clinic admins) */
export async function getClinicMe(): Promise<{
  clinic: ClinicWithCount;
  therapist_count: number;
}> {
  const { data } = await apiClient.get<{ clinic: ClinicWithCount; therapist_count: number }>(
    '/clinic-admin/clinics/me'
  );
  return data;
}

/** PATCH /clinic-admin/clinics/me – update first managed clinic */
export async function updateClinicMe(body: ClinicProfileUpdate): Promise<{ clinic: ClinicWithCount }> {
  const { data } = await apiClient.patch<{ clinic: ClinicWithCount }>(
    '/clinic-admin/clinics/me',
    body
  );
  return data;
}

export async function updateClinic(
  clinicId: string,
  body: ClinicProfileUpdate
): Promise<{ clinic: ClinicWithCount }> {
  const { data } = await apiClient.patch<{ clinic: ClinicWithCount }>(
    `/clinic-admin/clinics/${clinicId}`,
    body
  );
  return data;
}

export interface ClinicTherapist {
  id: string;
  name: string;
  specialty?: string | null;
  specialization?: string | null;
  bio?: string | null;
  location?: string | null;
  profile_image?: string | null;
  avatar_url?: string | null;
  verification_status?: string;
  is_verified: boolean;
  role_label?: string | null;
  is_primary: boolean;
  avg_rating?: number;
  review_count?: number;
}

export async function listTherapists(clinicId: string): Promise<{
  therapists: ClinicTherapist[];
}> {
  const { data } = await apiClient.get<{ therapists: ClinicTherapist[] }>(
    `/clinic-admin/clinics/${clinicId}/therapists`
  );
  return data;
}

export async function addTherapist(
  clinicId: string,
  email: string
): Promise<{ message: string; therapist: ClinicTherapist }> {
  const { data } = await apiClient.post<{ message: string; therapist: ClinicTherapist }>(
    `/clinic-admin/clinics/${clinicId}/therapists`,
    { email }
  );
  return data;
}

export async function removeTherapist(
  clinicId: string,
  psychologistId: string
): Promise<void> {
  await apiClient.delete(
    `/clinic-admin/clinics/${clinicId}/therapists/${psychologistId}`
  );
}

// --- Clinic-admin availability (slots on behalf of affiliated psychologists) ---

export interface ClinicAvailabilitySlot {
  id: string;
  owner_type: string;
  owner_id: string;
  starts_at_utc: string;
  ends_at_utc: string;
  status: string;
  created_by_user_id?: string | null;
  created_by_role?: string | null;
  managed_by_clinic_id?: string | null;
  version?: number;
  created_at: string;
  updated_at: string;
}

export async function listPsychologistAvailability(
  psychologistId: string,
  params?: { from?: string; to?: string }
): Promise<{ slots: ClinicAvailabilitySlot[] }> {
  const { data } = await apiClient.get<{ slots: ClinicAvailabilitySlot[] }>(
    `/clinic-admin/psychologists/${psychologistId}/availability`,
    { params }
  );
  return data;
}

export async function createPsychologistSlot(
  psychologistId: string,
  body: { starts_at_utc: string; ends_at_utc: string }
): Promise<{ slot: ClinicAvailabilitySlot }> {
  const { data } = await apiClient.post<{ slot: ClinicAvailabilitySlot }>(
    `/clinic-admin/psychologists/${psychologistId}/availability`,
    body
  );
  return data;
}

export async function deleteClinicAvailabilitySlot(
  slotId: string,
  expectedVersion?: number | null
): Promise<void> {
  const url =
    expectedVersion != null
      ? `/clinic-admin/availability/${slotId}?expectedVersion=${expectedVersion}`
      : `/clinic-admin/availability/${slotId}`;
  await apiClient.delete(url);
}
