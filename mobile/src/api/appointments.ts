/**
 * Appointments API – parent books, lists; therapist confirms/declines (therapist API elsewhere).
 */

import { apiClient } from '../lib/apiClient';

export interface Appointment {
  id: string;
  parent_user_id: string;
  psychologist_id: string;
  clinic_id: string | null;
  availability_slot_id: string;
  starts_at_utc: string;
  ends_at_utc: string;
  status: 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  parent_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  psychologist_name?: string;
}

export async function createAppointment(body: {
  therapist_id: string;
  availability_slot_id: string;
  parent_notes?: string | null;
}): Promise<{ appointment: Appointment }> {
  const { data } = await apiClient.post<{ appointment: Appointment }>('/appointments', body);
  return data;
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<{ appointments: Appointment[] }>('/appointments');
  return data.appointments ?? [];
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string | null
): Promise<{ appointment: Appointment }> {
  const { data } = await apiClient.patch<{ appointment: Appointment }>(
    `/appointments/${appointmentId}`,
    reason != null ? { action: 'cancel', reason } : { action: 'cancel' }
  );
  return data;
}
