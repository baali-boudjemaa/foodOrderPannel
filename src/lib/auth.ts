import { api } from './api';
import type { Role, User } from '@/types';

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function saveUser(user: User) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  saveUser(data);
  return data;
}

export async function completeAuth(accessToken: string, refreshToken: string): Promise<User> {
  saveTokens(accessToken, refreshToken);
  return fetchCurrentUser();
}

export function getHomeRouteForRole(role: Role): string {
  switch (role) {
    case 'DELIVERY':
      return '/delivery';
    case 'OWNER':
      return '/';
    case 'ADMIN':
      return '/';
    default:
      return '/';
  }
}

export function isLoggedIn(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
}
