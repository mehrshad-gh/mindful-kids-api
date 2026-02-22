export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'admin';
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  appRole: UserRole;
  selectedChildId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
