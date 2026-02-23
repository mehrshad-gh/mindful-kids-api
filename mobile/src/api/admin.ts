/**
 * Admin API – requires authenticated user with role admin.
 */

import { apiClient } from '../lib/apiClient';
import type { TherapistApplication } from '../types/therapist';

export interface AdminApplicationListItem extends TherapistApplication {
  user_email?: string;
  user_name?: string;
}

export interface AdminApplicationDetailResponse {
  application: TherapistApplication;
  user_email?: string;
  user_name?: string;
  clinic_affiliations: { clinic_id: string; role_label?: string; is_primary?: boolean }[];
}

export async function listTherapistApplications(params?: {
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  limit?: number;
}): Promise<{ applications: AdminApplicationListItem[] }> {
  const { data } = await apiClient.get<{ applications: AdminApplicationListItem[] }>(
    '/admin/therapist-applications',
    { params }
  );
  return data;
}

export async function getTherapistApplication(id: string): Promise<AdminApplicationDetailResponse> {
  const { data } = await apiClient.get<AdminApplicationDetailResponse>(
    `/admin/therapist-applications/${id}`
  );
  return data;
}

export async function reviewTherapistApplication(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ message: string; application: TherapistApplication }> {
  const { data } = await apiClient.patch<{ message: string; application: TherapistApplication }>(
    `/admin/therapist-applications/${id}`,
    status === 'rejected' ? { status, rejection_reason: rejectionReason } : { status }
  );
  return data;
}

export async function setPsychologistVerified(
  psychologistId: string,
  isVerified: boolean
): Promise<{ message: string; psychologist: unknown }> {
  const { data } = await apiClient.patch<{ message: string; psychologist: unknown }>(
    `/admin/psychologists/${psychologistId}`,
    { is_verified: isVerified }
  );
  return data;
}
