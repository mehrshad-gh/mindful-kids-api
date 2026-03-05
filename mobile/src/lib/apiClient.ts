import axios, { type AxiosInstance } from 'axios';
import { Alert } from 'react-native';
import { getToken } from '../services/tokenStorage';
import { navigateSafe } from '../navigation/navigationRef';

const SAFETY_FALLBACK_MESSAGE =
  "If you or someone else is in immediate danger, contact local emergency services. In the US and Canada you can call 911. Elsewhere, use your local emergency number.";

function safetyHelpFallbackAlert() {
  Alert.alert('Get help', SAFETY_FALLBACK_MESSAGE, [{ text: 'OK' }]);
}

const DEACTIVATED_MESSAGE = 'Account is deactivated';
const DEACTIVATED_CODE = 'ACCOUNT_DEACTIVATED';
const LEGAL_REACCEPT_CODE = 'LEGAL_REACCEPT_REQUIRED';
const SAFETY_ESCALATION_CODE = 'SAFETY_ESCALATION';

export type LegalGateMissingItem = { document_type: string; document_version: string };

let onAccountDeactivated: (() => void) | null = null;
let onLegalReacceptRequired: ((missing: LegalGateMissingItem[]) => void) | null = null;

/** Register handler for 401 with error "Account is deactivated". Called before reject. */
export function setAccountDeactivatedHandler(fn: (() => void) | null) {
  onAccountDeactivated = fn;
}

/** Register handler for 428 LEGAL_REACCEPT_REQUIRED. Called before reject so app can show legal gate. */
export function setLegalReacceptRequiredHandler(fn: ((missing: LegalGateMissingItem[]) => void) | null) {
  onLegalReacceptRequired = fn;
}

function isAccountDeactivatedResponse(response: { status: number; data?: unknown }): boolean {
  if (response?.status !== 401) return false;
  const d = response.data as { code?: string; error?: string; message?: string } | undefined;
  if (!d) return false;
  if (d.code === DEACTIVATED_CODE) return true;
  const msg = d.error ?? d.message ?? '';
  return msg === DEACTIVATED_MESSAGE;
}

function isLegalReacceptRequiredResponse(response: { status: number; data?: unknown }): boolean {
  if (response?.status !== 428) return false;
  const d = response.data as { code?: string; missing?: unknown } | undefined;
  return d?.code === LEGAL_REACCEPT_CODE && Array.isArray(d.missing);
}

function isSafetyEscalationResponse(response: { status: number; data?: unknown }): boolean {
  if (response?.status !== 422) return false;
  const d = response.data as { code?: string } | undefined;
  return d?.code === SAFETY_ESCALATION_CODE;
}

const getBaseURL = () => {
  // Expo: EXPO_PUBLIC_* is available at build time
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.replace(/\/$/, '');
  return 'https://mindful-kids-api-production.up.railway.app/api';
};

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response && isAccountDeactivatedResponse(err.response)) {
        onAccountDeactivated?.();
      }
      if (err.response && isLegalReacceptRequiredResponse(err.response)) {
        const missing = (err.response.data as { missing: LegalGateMissingItem[] }).missing;
        onLegalReacceptRequired?.(missing);
      }
      if (err.response && isSafetyEscalationResponse(err.response)) {
        const message =
          (err.response.data as { message?: string })?.message ||
          "If you or someone else is in immediate danger, call local emergency services. This app is not for emergencies.";
        Alert.alert('Safety note', message, [
          { text: 'OK', style: 'default' },
          { text: 'Get help now', onPress: () => navigateSafe('SafetyHelp', undefined, safetyHelpFallbackAlert) },
        ]);
        // Do not retry the request
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const apiClient = createClient();
export { getBaseURL };
