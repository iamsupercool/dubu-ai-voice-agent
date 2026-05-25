import { NextPageContext } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface ErrorProps {
  statusCode?: number;
}

const ERROR_MESSAGES: Record<number, { title: string; description: string }> = {
  404: {
    title: '페이지를 찾을 수 없어요',
    description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  },
  500: {
    title: '서버에 문제가 생겼어요',
    description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  403: {
    title: '접근 권한이 없어요',
    description: '이 페이지에 접근할 수 있는 권한이 없습니다.',
  },
};

const DEFAULT_ERROR = {
  title: '오류가 발생했어요',
  description: '예기치 않은 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

const DUBU_LINKS = [
  {
    href: 'https://dubu.career.greetinghr.com/ko/intro',
    label: '두부 커리어',
    description: '채용 정보 보기',
  },
  {
    href: 'https://dubuhomes.com/mainlanding',
    label: '두부홈즈',
    description: '공식 홈페이지 방문',
  },
];

export default function ErrorPage({ statusCode }: ErrorProps) {
  const router = useRouter();
  const errorInfo =
    statusCode && ERROR_MESSAGES[statusCode] ? ERROR_MESSAGES[statusCode] : DEFAULT_ERROR;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Link href="/" aria-label="홈으로">
          <Image src="/logo.png" alt="Dubu" width={120} height={28} priority />
        </Link>

        <div className="flex flex-col items-center gap-3">
          {statusCode && (
            <span className="text-7xl font-bold text-primary leading-none">{statusCode}</span>
          )}
          <h1 className="text-xl font-semibold text-foreground">{errorInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{errorInfo.description}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            이전 페이지로
          </button>
          <Link
            href="/"
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 text-center"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <div className="w-full border-t border-border pt-6">
          <p className="mb-3 text-xs text-muted-foreground">두부 서비스 바로가기</p>
          <div className="flex justify-center gap-4">
            {DUBU_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="font-medium text-foreground">{link.label}</span>
                <span className="text-xs text-muted-foreground">{link.description}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? undefined;
  return { statusCode };
};
