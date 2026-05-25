import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConvMenuProps {
  id: string;
  onDelete: (id: string) => void;
}

export default function ChatRoomsCardMenu({ id, onDelete }: ConvMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown() {
      setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right - 128 });
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        className={cn(
          'p-1 rounded text-muted-foreground transition-colors shrink-0',
          'hover:bg-muted-foreground/20 hover:text-foreground',
          open && 'bg-muted-foreground/20 text-foreground',
        )}
        onClick={handleOpen}
        title="더보기"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed z-50 min-w-[128px] rounded-md border bg-popover shadow-md py-1"
            style={{ top: pos.top, left: pos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete(id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
