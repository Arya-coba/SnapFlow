export type SnapFlowUser = {
  id?: number;
  name: string;
  email: string;
  picture?: string | null;
  role?: string;
};

const TOKEN_KEY = 'snapflow_token';
const USER_KEY = 'snapflow_user';

export function setAuth(token: string, user: SnapFlowUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SnapFlowUser | null {
  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Bersihkan key lama biar tidak nyangkut dari percobaan sebelumnya
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('snapflow_auth');

  sessionStorage.clear();
}