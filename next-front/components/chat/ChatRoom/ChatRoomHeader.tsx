import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/common/ui/badge';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface ChatHeaderProps {
  title: string;
  connectionState: ConnectionState;
}

export default function ChatRoomHeader({ title, connectionState }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
      <h1 className="text-base font-medium">{title}</h1>
      {connectionState === 'connecting' && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          연결 중...
        </Badge>
      )}
      {connectionState === 'connected' && <Badge variant="default">연결됨</Badge>}
      {connectionState === 'disconnected' && <Badge variant="destructive">연결 끊김</Badge>}
    </header>
  );
}
