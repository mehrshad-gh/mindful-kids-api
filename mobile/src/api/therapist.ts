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

export async function getProfile(): Promise<{ profile: unknown }> {
  const { data } = await apiClient.get<{ profile: unknown }>('/therapist/profile');
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
