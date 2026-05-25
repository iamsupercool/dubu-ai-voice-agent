import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  label?: string;
}

export default function FullPageLoader({ label = '불러오는 중...' }: FullPageLoaderProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </main>
  );
}
