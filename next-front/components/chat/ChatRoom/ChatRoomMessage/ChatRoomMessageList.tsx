import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/ui/avatar';
import { cn } from '@/lib/utils';
import ThinkingDots from '@/components/common/items/ThinkingDots';
import { Message } from '@/interfaces/Chat/Message.interface';

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
  streamingMessageId: string | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  scrollTrigger?: number;
  previewMessage?: string;
}

export default function ChatRoomMessageList({
  messages,
  isThinking,
  streamingMessageId,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  scrollTrigger,
  previewMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const savedScrollHeight = useRef(0);
  const prevIsLoadingMore = useRef(false);
  const loadTriggered = useRef(false);

  useLayoutEffect(() => {
    if (isInitialMount.current && messages.length > 0) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      isInitialMount.current = false;
    }
  }, [messages]);

  useLayoutEffect(() => {
    if (prevIsLoadingMore.current && !isLoadingMore) {
      const el = scrollRef.current;
      if (el && savedScrollHeight.current > 0) {
        el.scrollTop = el.scrollHeight - savedScrollHeight.current;
        savedScrollHeight.current = 0;
      }
      loadTriggered.current = false;
    }
    prevIsLoadingMore.current = isLoadingMore;
  });

  useEffect(() => {
    if (isInitialMount.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 150) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isThinking, streamingMessageId, previewMessage]);

  useEffect(() => {
    if (scrollTrigger === undefined || isInitialMount.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollTrigger]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || isLoadingMore || loadTriggered.current) return;
    if (el.scrollTop < 80) {
      savedScrollHeight.current = el.scrollHeight;
      loadTriggered.current = true;
      onLoadMore?.();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-4">
      {isLoadingMore && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
        </div>
      )}
      <div className="space-y-4">
        {messages.map((msg) => {
          const isStreaming = msg.id === streamingMessageId;
          return (
            <div key={msg.id} data-role={msg.role}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] break-words">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start gap-2">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage asChild src="/AI-Avatar.png">
                      <Image src="/AI-Avatar.png" alt="AI" width={32} height={32} />
                    </AvatarImage>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%]',
                      isStreaming && 'border-l-2 border-primary',
                    )}
                  >
                    {isStreaming && !msg.text ? (
                      <ThinkingDots />
                    ) : (
                      <>
                        {msg.text}
                        {isStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {previewMessage && (
          <div data-role="user">
            <div className="flex justify-end">
              <div className="bg-primary/70 text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] break-words">
                {previewMessage}
                <span className="inline-block w-0.5 h-4 bg-primary-foreground/80 animate-pulse ml-1 align-middle" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
