/**
 * Public clinic application API – no auth required.
 */

import axios from 'axios';
import { getBaseURL } from '../lib/apiClient';
import type { ClinicApplication } from '../types/therapist';

export interface SubmitClinicApplicationPayload {
  clinic_name: string;
  country: string;
  contact_email: string;
  contact_phone?: string;
  description?: string;
}

export interface SubmitClinicApplicationResponse {
  message: string;
  application: { id: string; status: string; submitted_at: string };
}

/** Submit clinic application with document (multipart). Public, no auth. */
export async function submitClinicApplication(
  payload: SubmitClinicApplicationPayload,
  file: { uri: string; name: string; mimeType?: string }
): Promise<SubmitClinicApplicationResponse> {
  const formData = new FormData();
  formData.append('clinic_name', payload.clinic_name.trim());
  formData.append('country', payload.country.trim());
  formData.append('contact_email', payload.contact_email.trim());
  if (payload.contact_phone?.trim()) {
    formData.append('contact_phone', payload.contact_phone.trim());
  }
  if (payload.description?.trim()) {
    formData.append('description', payload.description.trim());
  }
  formData.append('document', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const baseURL = getBaseURL();
  const { data } = await axios.post<SubmitClinicApplicationResponse>(
    `${baseURL}/clinic-applications`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }
  );
  return data;
}
