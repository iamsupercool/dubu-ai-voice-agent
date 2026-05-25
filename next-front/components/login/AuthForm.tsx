import type { FormEvent } from 'react';
import { Button } from '@/components/common/ui/button';
import { Input } from '@/components/common/ui/input';
import { Label } from '@/components/common/ui/label';
import { AuthMode } from '@/types/Auth/AuthMode.type';

interface AuthFormProps {
  mode: AuthMode;
  username: string;
  password: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

const labels = {
  login: {
    username: '유저명',
    password: '비밀번호',
    button: '로그인',
    loading: '로그인 중...',
  },
  register: {
    username: '유저명 (3자 이상)',
    password: '비밀번호 (4자 이상)',
    button: '회원가입',
    loading: '가입 중...',
  },
} as const;

export default function AuthForm({
  mode,
  username,
  password,
  isLoading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  const idPrefix = mode === 'login' ? 'login' : 'reg';
  const text = labels[mode];

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label={text.button}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-username`}>{text.username}</Label>
        <Input
          id={`${idPrefix}-username`}
          type="text"
          placeholder="유저명을 입력하세요"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          required
          minLength={mode === 'register' ? 3 : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`}>{text.password}</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          minLength={mode === 'register' ? 4 : undefined}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? text.loading : text.button}
      </Button>
    </form>
  );
}
