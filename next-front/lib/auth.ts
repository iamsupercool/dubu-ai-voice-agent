export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USERNAME_KEY = 'auth_username';

const ss = () => (typeof window !== 'undefined' ? window.sessionStorage : null);

export const saveAuth = (token: string, username: string): void => {
  ss()?.setItem(AUTH_TOKEN_KEY, token);
  ss()?.setItem(AUTH_USERNAME_KEY, username);
};

export const getToken = (): string | null => ss()?.getItem(AUTH_TOKEN_KEY) ?? null;

export const getUsername = (): string | null => ss()?.getItem(AUTH_USERNAME_KEY) ?? null;

export const clearAuth = (): void => {
  ss()?.removeItem(AUTH_TOKEN_KEY);
  ss()?.removeItem(AUTH_USERNAME_KEY);
};

export const isAuthenticated = (): boolean => !!getToken();
