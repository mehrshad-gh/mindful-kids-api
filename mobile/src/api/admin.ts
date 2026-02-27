/**
 * Admin API – requires authenticated user with role admin.
 */

import { apiClient } from '../lib/apiClient';
import type { TherapistApplication } from '../types/therapist';

export interface AdminApplicationListItem extends TherapistApplication {
  user_email?: string;
  user_name?: string;
  /** When application is approved, current verification status of the linked psychologist (suspended/rejected after report action). */
  psychologist_verification_status?: string | null;
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

// Reports (trust & safety)
export type ProfessionalReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type ProfessionalReportActionTaken =
  | 'none'
  | 'warning'
  | 'temporary_suspension'
  | 'verification_revoked';

export interface AdminReportListItem {
  id: string;
  reporter_id: string;
  psychologist_id: string;
  reason: string;
  details: string | null;
  status: ProfessionalReportStatus;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
}

export async function listReports(params?: {
  status?: ProfessionalReportStatus;
  limit?: number;
}): Promise<{ reports: AdminReportListItem[] }> {
  const { data } = await apiClient.get<{ reports: AdminReportListItem[] }>('/admin/reports', {
    params,
  });
  return data;
}

export async function getReport(id: string): Promise<{ report: AdminReportListItem }> {
  const { data } = await apiClient.get<{ report: AdminReportListItem }>(`/admin/reports/${id}`);
  return data;
}

export async function updateReport(
  id: string,
  payload: { status?: ProfessionalReportStatus; action_taken?: ProfessionalReportActionTaken }
): Promise<{ message: string; report: AdminReportListItem }> {
  const { data } = await apiClient.patch<{ message: string; report: AdminReportListItem }>(
    `/admin/reports/${id}`,
    payload
  );
  return data;
}
