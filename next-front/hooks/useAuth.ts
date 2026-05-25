import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AxiosError } from 'axios';
import apiClient from '@/lib/apiClient';
import { clearAuth, isAuthenticated, saveAuth } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return null;
    }
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
      return data;
    } catch {
      // 401은 interceptor에서 clearAuth + redirect 처리
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const { data } = await apiClient.post('/auth/login', { username, password });
      saveAuth(data.access_token, data.username);
      setUser({ id: data.id, username: data.username });
      return data;
    } catch (e: unknown) {
      const err = e instanceof AxiosError ? e.response?.data : null;
      throw new Error(err?.message || '로그인 실패');
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const { data } = await apiClient.post('/auth/register', { username, password });
      return data;
    } catch (e: unknown) {
      const err = e instanceof AxiosError ? e.response?.data : null;
      throw new Error(err?.message || '회원가입 실패');
    }
  }, []);

  const logout = useCallback(async () => {
    clearAuth();
    setUser(null);
    router.push('/');
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // login/register 후 토큰이 없으므로 interceptor에 영향 없음
  // (login API는 공개 엔드포인트, 토큰이 없어도 호출 가능)

  return { user, isLoading, login, logout, register, checkAuth };
}
