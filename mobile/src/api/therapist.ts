import axios from 'axios';
import { apiClient, getBaseURL } from '../lib/apiClient';
import { getToken } from '../services/tokenStorage';
import type {
  TherapistApplication,
  TherapistCredential,
  ClinicAffiliation,
} from '../types/therapist';

export interface ApplicationResponse {
  application: TherapistApplication | null;
  clinic_affiliations: { clinic_id: string; role_label?: string; is_primary?: boolean }[];
}

export async function getApplication(): Promise<ApplicationResponse> {
  const { data } = await apiClient.get<ApplicationResponse>('/therapist/application');
  return data;
}

export interface UpsertApplicationPayload {
  professional_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  specialization?: string[];
  bio?: string;
  location?: string;
  languages?: string[];
  profile_image_url?: string;
  video_urls?: string[];
  contact_info?: Record<string, unknown>;
  credentials?: TherapistCredential[];
  clinic_affiliations?: ClinicAffiliation[];
}

export async function upsertApplication(payload: UpsertApplicationPayload): Promise<ApplicationResponse> {
  const { data } = await apiClient.put<ApplicationResponse>('/therapist/application', payload);
  return data;
}

export async function submitApplication(): Promise<{ message: string; application: TherapistApplication }> {
  const { data } = await apiClient.post<{ message: string; application: TherapistApplication }>(
    '/therapist/application/submit'
  );
  return data;
}

export interface TherapistProfileClinic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  country?: string | null;
  website?: string | null;
  logo_url?: string | null;
  role_label?: string | null;
  is_primary: boolean;
}

export interface TherapistProfile {
  id: string;
  user_id: string | null;
  name: string;
  specialty?: string | null;
  specialization?: string[] | null;
  bio?: string | null;
  location?: string | null;
  profile_image?: string | null;
  contact_info?: Record<string, unknown>;
  email?: string | null;
  phone?: string | null;
  verification_status?: string;
  is_verified: boolean;
  avg_rating?: number;
  review_count?: number;
  clinics: TherapistProfileClinic[];
}

export interface TherapistVerificationStatus {
  application_status: string | null;
  psychologist_id: string | null;
  verification_status: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verification_expires_at: string | null;
  last_reviewed_at: string | null;
}

export async function getProfile(): Promise<{ profile: TherapistProfile | null; message?: string }> {
  const { data } = await apiClient.get<{ profile: TherapistProfile | null; message?: string }>('/therapist/profile');
  return data;
}

/** GET /therapist/me/profile – profile for dashboard (same as getProfile) */
export async function getProfileMe(): Promise<{ profile: TherapistProfile | null; message?: string }> {
  const { data } = await apiClient.get<{ profile: TherapistProfile | null; message?: string }>('/therapist/me/profile');
  return data;
}

/** GET /therapist/me/verification-status */
export async function getVerificationStatus(): Promise<TherapistVerificationStatus> {
  const { data } = await apiClient.get<TherapistVerificationStatus>('/therapist/me/verification-status');
  return data;
}

/** GET /therapist/me/credentials – list credentials (pending_review | verified | rejected | expired) */
export interface TherapistMeCredential {
  id: string;
  credential_type: string;
  issuing_country?: string | null;
  issuer?: string | null;
  license_number?: string | null;
  expires_at: string | null;
  verification_status: 'pending_review' | 'verified' | 'rejected' | 'expired';
  verified_at: string | null;
  document_url?: string | null;
  renewal_requested_at: string | null;
  created_at: string;
}

export async function getCredentials(): Promise<{ credentials: TherapistMeCredential[] }> {
  const { data } = await apiClient.get<{ credentials: TherapistMeCredential[] }>('/therapist/me/credentials');
  return data;
}

/** POST /therapist/me/credentials – submit new credential (document_url) or request renewal (credential_id + renewal_requested: true) */
export async function postCredentials(payload: {
  document_url?: string;
  credential_type?: string;
  credential_id?: string;
  renewal_requested?: boolean;
}): Promise<
  | { message: string; credential: TherapistMeCredential }
  | { message: string; credential: TherapistMeCredential; error?: string }
> {
  const { data } = await apiClient.post<
    | { message: string; credential: TherapistMeCredential }
    | { message: string; credential: TherapistMeCredential; error?: string }
  >('/therapist/me/credentials', payload);
  return data;
}

/** GET /therapist/me/reports – reports targeting this therapist (view only) */
export interface TherapistMeReport {
  id: string;
  reason: string;
  status: string;
  created_at: string;
}

export async function getReports(): Promise<{ reports: TherapistMeReport[] }> {
  const { data } = await apiClient.get<{ reports: TherapistMeReport[] }>('/therapist/me/reports');
  return data;
}

/** GET /therapist/me/clinic-affiliations – clinic name, role, status (active | pending | removed) */
export interface TherapistMeClinicAffiliation {
  clinic_id: string;
  clinic_name: string;
  role: string | null;
  status: 'active' | 'pending' | 'removed';
}

export async function getClinicAffiliations(): Promise<{
  affiliations: TherapistMeClinicAffiliation[];
}> {
  const { data } = await apiClient.get<{ affiliations: TherapistMeClinicAffiliation[] }>(
    '/therapist/me/clinic-affiliations'
  );
  return data;
}

/** Upload a credential document (PDF or image). Returns URL to use as document_url. */
export async function uploadCredentialDocument(file: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('document', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
  const baseURL = getBaseURL();
  const token = await getToken();
  const { data } = await axios.post<{ url: string }>(
    `${baseURL}/therapist/credential-document`,
    formData,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 20000,
    }
  );
  return data;
}
