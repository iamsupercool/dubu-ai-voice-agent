import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/tabs';
import AuthForm from '@/components/login/AuthForm';
import AuthStatusMessage from '@/components/login/AuthStatusMessage';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/common/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { FormEvent, useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { AuthMode } from '@/types/Auth/AuthMode.type';

type AuthTab = 'login' | 'register';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) router.replace('/chat');
  }, [router]);
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const AUTH_TABS = [
    { tabName: '로그인', value: 'login' as AuthMode },
    { tabName: '회원가입', value: 'register' as AuthMode },
  ];

  function resetForm() {
    setUsername('');
    setPassword('');
    setError(null);
    setSuccess(null);
  }

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab as AuthTab);
    resetForm();
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.push('/chat');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await register(username, password);
      resetForm();
      setActiveTab('login');
      setSuccess('가입이 완료되었습니다! 로그인해주세요.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md" aria-labelledby="login-title">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-3 flex justify-center">
              <Image src="/logo.png" alt="Dubu" width={160} height={37} priority />
            </div>
            <h1 id="login-title" className="sr-only">
              Dubu 로그인
            </h1>
            <CardDescription>AI 음성 대화 서비스</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4 grid w-full grid-cols-2">
                {AUTH_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.tabName}
                  </TabsTrigger>
                ))}
              </TabsList>

              <AuthStatusMessage error={error} success={success} />

              {AUTH_TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <AuthForm
                    mode={tab.value}
                    username={username}
                    password={password}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onPasswordChange={setPassword}
                    onSubmit={(e) => (tab.value === 'login' ? handleLogin(e) : handleRegister(e))}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
