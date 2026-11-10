import {
  authSessionSchema,
  authUserSchema,
  type AuthSession,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from '@real-estate/contracts';
import { apiClient } from '@/lib/api/client';

/** Renews the session through the API client's single-flight refresh (shared with its 401 retry). */
export { refreshSession } from '@/lib/api/client';

export function hasSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('has_session') === 'true';
}

function notifyAuthChange(hasSession: boolean) {
  if (typeof window === 'undefined') return;
  if (hasSession) {
    localStorage.setItem('has_session', 'true');
  } else {
    localStorage.removeItem('has_session');
  }
  window.dispatchEvent(new CustomEvent('auth-change', { detail: { hasSession } }));
}

/** Creates the account; the API signs the user in by setting the session cookies. */
export async function register(input: RegisterRequest): Promise<AuthSession> {
  const session = await apiClient.post('/auth/register', { body: input, schema: authSessionSchema });
  notifyAuthChange(true);
  return session;
}

export async function login(input: LoginRequest): Promise<AuthSession> {
  const session = await apiClient.post('/auth/login', { body: input, schema: authSessionSchema });
  notifyAuthChange(true);
  return session;
}

/** Ends the session; the API revokes the refresh token, clears both cookies and answers 204. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    notifyAuthChange(false);
  }
}

export function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return apiClient.get('/auth/me', { schema: authUserSchema, signal });
}
