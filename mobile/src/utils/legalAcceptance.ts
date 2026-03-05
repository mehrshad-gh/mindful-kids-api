/**
 * Centralized legal acceptance recording after successful auth (token stored).
 * Use only in authenticated flows: family register, therapist register, clinic set-password.
 * Do NOT use in unauthenticated flows (e.g. clinic application form).
 */
import { recordLegalAcceptance } from '../services/authService';
import { LEGAL_DOCUMENT_VERSION } from '../constants/legalContent';

export type StandardAcceptanceType = 'terms' | 'privacy_policy' | 'professional_disclaimer' | 'provider_terms';

/**
 * Record legal acceptances for the current user (must be called after login/register/setPassword
 * has succeeded and token is stored). Each call is wrapped in try/catch so failures do not block
 * the auth flow. Uses LEGAL_DOCUMENT_VERSION from legalContent.ts.
 */
export async function recordStandardAcceptances(
  types: StandardAcceptanceType[]
): Promise<void> {
  const version = LEGAL_DOCUMENT_VERSION;
  for (const documentType of types) {
    try {
      await recordLegalAcceptance(documentType, version);
      if (__DEV__) {
        console.log(`[legal] Recorded acceptance: ${documentType} @ ${version}`);
      }
    } catch (e) {
      if (__DEV__) {
        console.warn(`[legal] Failed to record ${documentType}:`, e);
      }
      // Non-blocking: do not rethrow; user is already authenticated
    }
  }
}
