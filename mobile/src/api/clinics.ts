import { apiClient } from '../lib/apiClient';
import type { Clinic, ClinicTherapist } from '../types/therapist';

export async function listClinics(params?: {
  country?: string;
  search?: string;
  limit?: number;
}): Promise<{ clinics: Clinic[] }> {
  const { data } = await apiClient.get<{ clinics: Clinic[] }>('/clinics', { params });
  return data;
}

export interface ClinicDetailResponse {
  clinic: Clinic;
  therapists: ClinicTherapist[];
}

export async function getClinic(id: string): Promise<ClinicDetailResponse> {
  const { data } = await apiClient.get<ClinicDetailResponse>(`/clinics/${id}`);
  return data;
}
