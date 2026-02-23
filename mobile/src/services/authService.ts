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
