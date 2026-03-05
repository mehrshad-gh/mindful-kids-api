/**
 * Admin API – requires authenticated user with role admin.
 */

import { apiClient, getBaseURL } from '../lib/apiClient';
import type { TherapistApplication, Clinic, ClinicApplication, AdminClinicDetailResponse } from '../types/therapist';

export interface AdminDashboard {
  pending_therapist_applications: number;
  pending_clinic_applications: number;
  verified_therapists_count: number;
  verified_clinics_count: number;
  reports_pending_review: number;
}

export async function getDashboard(): Promise<AdminDashboard> {
  const { data } = await apiClient.get<AdminDashboard>('/admin/dashboard');
  return data;
}

// User management by role
export type AdminUserRole = 'parent' | 'therapist' | 'clinic_admin' | 'admin';

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersSummary {
  parents: number;
  therapists: number;
  clinic_admins: number;
  admins: number;
}

export type AdminUserSort =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'name_asc'
  | 'name_desc'
  | 'email_asc'
  | 'email_desc';

export async function listAdminUsers(params: {
  role: AdminUserRole;
  limit?: number;
  offset?: number;
  q?: string;
  sort?: AdminUserSort;
}): Promise<{ users: AdminUserListItem[]; total: number }> {
  const { data } = await apiClient.get<{ users: AdminUserListItem[]; total: number }>('/admin/users', {
    params,
  });
  return data;
}

export interface AdminUserDetailResponse {
  user: AdminUserListItem & { role: string };
  clinics?: { id: string; name: string }[];
  psychologist_id?: string;
}

export async function getAdminUser(id: string): Promise<AdminUserDetailResponse> {
  const { data } = await apiClient.get<AdminUserDetailResponse>(`/admin/users/${id}`);
  return data;
}

export async function getAdminUsersSummary(): Promise<AdminUsersSummary> {
  const { data } = await apiClient.get<AdminUsersSummary>('/admin/users/summary');
  return data;
}

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

/** GET /admin/psychologists/:id – admin therapist/psychologist detail (for clinic detail → therapist tap) */
export interface AdminPsychologistDetail {
  id: string;
  name: string;
  specialty?: string | null;
  verification_status?: string;
  is_active?: boolean;
  user_id?: string | null;
  [key: string]: unknown;
}

export async function getAdminPsychologist(id: string): Promise<{ psychologist: AdminPsychologistDetail }> {
  const { data } = await apiClient.get<{ psychologist: AdminPsychologistDetail }>(`/admin/psychologists/${id}`);
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

/** PATCH /admin/psychologists/:id/status – active | suspended | rejected */
export async function setPsychologistStatus(
  psychologistId: string,
  status: 'active' | 'suspended' | 'rejected'
): Promise<{ message: string; psychologist: unknown }> {
  const { data } = await apiClient.patch<{ message: string; psychologist: unknown }>(
    `/admin/psychologists/${psychologistId}/status`,
    { status }
  );
  return data;
}

/** PATCH /admin/clinics/:id/status – active | suspended | rejected */
export async function setClinicStatus(
  clinicId: string,
  status: 'active' | 'suspended' | 'rejected'
): Promise<{ message: string; clinic: Clinic }> {
  const { data } = await apiClient.patch<{ message: string; clinic: Clinic }>(
    `/admin/clinics/${clinicId}/status`,
    { status }
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

// Clinics (admin control: list with filters/pagination, detail, admins, invites)
export type AdminClinicStatusFilter = 'verified' | 'pending' | 'suspended' | 'rejected' | 'all';

export async function listAdminClinics(params?: {
  status?: AdminClinicStatusFilter;
  country?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ clinics: Clinic[] }> {
  const { data } = await apiClient.get<{ clinics: Clinic[] }>('/admin/clinics', { params });
  return data;
}

export async function getAdminClinic(id: string): Promise<AdminClinicDetailResponse> {
  const { data } = await apiClient.get<AdminClinicDetailResponse>(`/admin/clinics/${id}`);
  return data;
}

export async function addClinicAdmin(
  clinicId: string,
  body: { email: string; name?: string }
): Promise<
  | { message: string; added: { user_id: string; email: string; name: string }; admins: { user_id: string; name: string; email: string; created_at: string }[] }
  | { message: string; invite_link: string; invite_id: string; contact_email: string; expires_at: string }
> {
  const { data } = await apiClient.post(`/admin/clinics/${clinicId}/admins`, body);
  return data as any;
}

export async function removeClinicAdmin(clinicId: string, userId: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/clinics/${clinicId}/admins/${userId}`);
  return data;
}

export async function rotateClinicInvite(inviteId: string): Promise<{ message: string; invite_link: string; expires_at: string }> {
  const { data } = await apiClient.post<{ message: string; invite_link: string; expires_at: string }>(
    `/admin/clinic-invites/${inviteId}/rotate`
  );
  return data;
}

export async function revokeClinicInvite(inviteId: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/clinic-invites/${inviteId}`);
  return data;
}

export interface CreateClinicPayload {
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  address?: string;
  country?: string;
  website?: string;
  logo_url?: string;
}

export async function createClinic(payload: CreateClinicPayload): Promise<{ clinic: Clinic }> {
  const { data } = await apiClient.post<{ clinic: Clinic }>('/admin/clinics', payload);
  return data;
}

// Clinic applications (onboarding: list, review, approve/reject)
export async function listClinicApplications(params?: {
  status?: 'pending' | 'approved' | 'rejected';
  country?: string;
  limit?: number;
}): Promise<{ applications: ClinicApplication[] }> {
  const { data } = await apiClient.get<{ applications: ClinicApplication[] }>(
    '/admin/clinic-applications',
    { params }
  );
  return data;
}

export async function getClinicApplication(id: string): Promise<{ application: ClinicApplication }> {
  const { data } = await apiClient.get<{ application: ClinicApplication }>(
    `/admin/clinic-applications/${id}`
  );
  return data;
}

export async function getClinicApplicationDocumentUrl(
  id: string
): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>(
    `/admin/clinic-applications/${id}/document-link`
  );
  const baseURL = getBaseURL();
  const fullUrl = data.url.startsWith('http') ? data.url : `${baseURL}${data.url}`;
  return { url: fullUrl };
}

export async function reviewClinicApplication(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ message: string; application: ClinicApplication; clinic?: Clinic }> {
  const { data } = await apiClient.patch<
    { message: string; application: ClinicApplication; clinic?: Clinic }
  >(`/admin/clinic-applications/${id}`, {
    status,
    ...(status === 'rejected' && rejectionReason ? { rejection_reason: rejectionReason } : {}),
  });
  return data;
}

// Content (articles, videos, activities) – admin list, get one, update (publish/unpublish)
export type AdminContentType = 'article' | 'video' | 'activity';

export interface AdminContentItem {
  id: string;
  type: AdminContentType;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  video_url: string | null;
  age_range: string | null;
  tags: string[];
  psychology_basis: string[];
  for_parents_notes: string | null;
  evidence_notes: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAdminContent(params?: {
  type?: AdminContentType;
}): Promise<{ items: AdminContentItem[] }> {
  const { data } = await apiClient.get<{ items: AdminContentItem[] }>('/admin/content', {
    params: params?.type ? { type: params.type } : undefined,
  });
  return data;
}

export async function getAdminContent(id: string): Promise<{ item: AdminContentItem }> {
  const { data } = await apiClient.get<{ item: AdminContentItem }>(`/admin/content/${id}`);
  return data;
}

export async function updateAdminContent(
  id: string,
  payload: Partial<Pick<AdminContentItem, 'title' | 'summary' | 'body_markdown' | 'video_url' | 'age_range' | 'tags' | 'psychology_basis' | 'for_parents_notes' | 'evidence_notes' | 'is_published'>>
): Promise<{ item: AdminContentItem }> {
  const { data } = await apiClient.patch<{ item: AdminContentItem }>(
    `/admin/content/${id}`,
    payload
  );
  return data;
}
