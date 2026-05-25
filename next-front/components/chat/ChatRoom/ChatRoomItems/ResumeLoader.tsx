import { cn } from '@/lib/utils';

const SPINNER_DURATION_MS = 1000;

interface ResumeLoaderProps {
  title?: string;
  spinDurationMs?: number;
}

export default function ResumeLoader({
  title,
  spinDurationMs = SPINNER_DURATION_MS,
}: ResumeLoaderProps) {
  const spinStyle = { animationDuration: `${spinDurationMs}ms` };

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
      )}
    >
      <div className="relative mb-6">
        <div
          className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin"
          style={spinStyle}
        />
      </div>

      <p className="text-sm font-medium text-foreground mb-1">대화를 불러오는 중이에요</p>
      {title && (
        <p className="text-xs text-muted-foreground max-w-[200px] truncate text-center">{title}</p>
      )}
    </div>
  );
}
