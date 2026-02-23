/**
 * Trust & safety: report a professional.
 */

import { apiClient } from '../lib/apiClient';

export type ReportProfessionalReason =
  | 'misconduct'
  | 'inaccurate_info'
  | 'inappropriate_behavior'
  | 'other';

export interface ReportProfessionalPayload {
  psychologist_id: string;
  reason?: ReportProfessionalReason;
  details?: string | null;
}

export async function reportProfessional(payload: ReportProfessionalPayload): Promise<void> {
  await apiClient.post('/reports/professional', payload);
}
