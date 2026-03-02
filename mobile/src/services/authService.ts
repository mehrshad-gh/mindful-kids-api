import { apiClient } from '../lib/apiClient';
import { setToken as storeToken, removeToken } from './tokenStorage';
import type { User } from '../types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: 'parent' | 'therapist' | 'clinic_admin';
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  await storeToken(data.token);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const body = payload.role
    ? { email: payload.email, password: payload.password, name: payload.name, role: payload.role }
    : { email: payload.email, password: payload.password, name: payload.name };
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body);
  await storeToken(data.token);
  return data;
}

export async function getMe(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await removeToken();
}

/** Clinic invite: set password with one-time token; creates account and returns token. */
export async function setPasswordFromInvite(token: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/set-password-from-invite', { token, password });
  await storeToken(data.token);
  return data;
}

export type LegalDocumentType = 'terms' | 'privacy_policy' | 'professional_disclaimer';

export type LegalAcceptanceEntry = { accepted_at: string; document_version: string };

/** Record that the current user accepted a legal document (call after login/register; requires token). Pass documentVersion when recording so backend knows which version was accepted (for future re-accept flow). */
export async function recordLegalAcceptance(
  documentType: LegalDocumentType,
  documentVersion?: string
): Promise<void> {
  await apiClient.post('/auth/me/legal-acceptance', {
    document_type: documentType,
    ...(documentVersion != null && { document_version: documentVersion }),
  });
}

/** Get latest acceptance per document type (accepted_at, document_version) for the current user. */
export async function getLegalAcceptances(): Promise<Record<string, LegalAcceptanceEntry>> {
  const { data } = await apiClient.get<{
    acceptances: Record<string, LegalAcceptanceEntry>;
  }>('/auth/me/legal-acceptances');
  return data.acceptances ?? {};
}
