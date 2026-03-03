/**
 * Therapist availability API – create, list, delete slots.
 */

import { apiClient } from '../lib/apiClient';

export interface TherapistSlot {
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
  created_at?: string;
  updated_at?: string;
}

export async function fetchMyAvailability(params?: {
  from?: string;
  to?: string;
}): Promise<TherapistSlot[]> {
  const { data } = await apiClient.get<{ slots: TherapistSlot[] }>('/therapist/availability', {
    params,
  });
  return data.slots ?? [];
}

export async function createSlot(body: {
  starts_at_utc: string;
  ends_at_utc: string;
}): Promise<{ slot: TherapistSlot }> {
  const { data } = await apiClient.post<{ slot: TherapistSlot }>('/therapist/availability', body);
  return data;
}

export async function deleteSlot(slotId: string, expectedVersion?: number | null): Promise<void> {
  const url =
    expectedVersion != null
      ? `/therapist/availability/${slotId}?expectedVersion=${expectedVersion}`
      : `/therapist/availability/${slotId}`;
  await apiClient.delete(url);
}
