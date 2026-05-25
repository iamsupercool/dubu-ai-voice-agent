import Greeting from '@/components/chat/ChatRoom/ChatRoomItems/Greeting';
import ResumeLoader from '@/components/chat/ChatRoom/ChatRoomItems/ResumeLoader';
import ChatRoomMessageList from '@/components/chat/ChatRoom/ChatRoomMessage/ChatRoomMessageList';
import { Message } from '@/interfaces/Chat/Message.interface';

interface ChatMessagePanelProps {
  messages: Message[];
  isResuming: boolean;
  isThinking: boolean;
  streamingMessageId: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  scrollTrigger: number;
  previewMessage?: string;
  conversationKey: string;
  onLoadMore: () => void;
}

export default function ChatRoomMessagePanel({
  messages,
  isResuming,
  isThinking,
  streamingMessageId,
  hasMore,
  isLoadingMore,
  scrollTrigger,
  previewMessage,
  conversationKey,
  onLoadMore,
}: ChatMessagePanelProps) {
  if (isResuming) return <ResumeLoader />;

  if (!previewMessage && messages.length === 0) return <Greeting />;

  return (
    <ChatRoomMessageList
      key={conversationKey}
      messages={messages}
      isThinking={isThinking}
      streamingMessageId={streamingMessageId}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      scrollTrigger={scrollTrigger}
      previewMessage={previewMessage}
    />
  );
}
