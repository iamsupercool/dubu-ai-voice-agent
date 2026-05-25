import { cn } from '@/lib/utils';
import ChatRoomsCardMenu from './ChatRoomsCardMenu';

interface ChatRoomsCardProps {
  id: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ChatRoomsCard({
  id,
  title,
  updatedAt,
  isActive,
  onSelect,
  onDelete,
}: ChatRoomsCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border pr-1 transition-colors',
        'hover:bg-muted/60',
        isActive ? 'bg-muted border-border' : 'bg-card border-transparent hover:border-border',
      )}
    >
      <button className="flex-1 text-left px-3 py-2.5 min-w-0" onClick={() => onSelect(id)}>
        <p className={cn('text-sm truncate', isActive && 'font-medium')}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(updatedAt).toLocaleDateString('ko-KR')}
        </p>
      </button>

      <ChatRoomsCardMenu id={id} onDelete={onDelete} />
    </div>
  );
}
