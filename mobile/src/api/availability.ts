/**
 * Availability & appointments API (booking flow).
 */

import { apiClient } from '../lib/apiClient';

export interface AvailabilitySlot {
  id: string;
  owner_type: string;
  owner_id: string;
  starts_at_utc: string;
  ends_at_utc: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/** Public: open slots for a psychologist (next 14 days default). */
export async function fetchPsychologistAvailability(
  psychologistId: string,
  params?: { from?: string; to?: string }
): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.get<{ slots: AvailabilitySlot[] }>(
    `/psychologists/${psychologistId}/availability`,
    { params }
  );
  return data.slots ?? [];
}
