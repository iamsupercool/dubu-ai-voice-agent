import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/ui/button';

interface WsErrorBannerProps {
  error: string;
  reconnectCount: number;
  isReconnecting: boolean;
  onReconnect: () => void;
}

export default function WsErrorBanner({
  error,
  reconnectCount,
  isReconnecting,
  onReconnect,
}: WsErrorBannerProps) {
  return (
    <div className="border-t p-4">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>

        {isReconnecting && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>재연결 시도 중... ({reconnectCount}/3)</span>
          </div>
        )}

        {!isReconnecting && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={onReconnect}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            재연결하기
          </Button>
        )}
      </div>
    </div>
  );
}
