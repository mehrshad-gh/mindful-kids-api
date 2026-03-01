export type UserRole = 'parent' | 'child' | 'therapist' | 'admin' | 'clinic_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'admin' | 'therapist' | 'clinic_admin';
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  appRole: UserRole;
  selectedChildId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
