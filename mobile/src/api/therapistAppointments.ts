/**
 * Therapist appointments API – list requests, confirm/decline/cancel.
 */

import { apiClient } from '../lib/apiClient';

export interface TherapistAppointment {
  id: string;
  parent_user_id: string;
  psychologist_id: string;
  clinic_id: string | null;
  availability_slot_id: string;
  starts_at_utc: string;
  ends_at_utc: string;
  status: string;
  parent_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  psychologist_name?: string;
  parent_name?: string;
  parent_email?: string;
}

export async function fetchMyAppointments(params?: {
  status?: string;
}): Promise<TherapistAppointment[]> {
  const { data } = await apiClient.get<{ appointments: TherapistAppointment[] }>(
    '/therapist/appointments',
    { params }
  );
  return data.appointments ?? [];
}

export async function updateAppointmentStatus(
  appointmentId: string,
  action: 'confirm' | 'decline' | 'cancel',
  reason?: string | null
): Promise<{ appointment: TherapistAppointment }> {
  const { data } = await apiClient.patch<{ appointment: TherapistAppointment }>(
    `/therapist/appointments/${appointmentId}`,
    reason != null ? { action, reason } : { action }
  );
  return data;
}

export async function getAppointmentCounts(): Promise<{ requested: number }> {
  const { data } = await apiClient.get<{ requested: number }>('/therapist/appointments/counts');
  return data;
}
