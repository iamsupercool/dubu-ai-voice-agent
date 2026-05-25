import { ScrollArea } from '@/components/common/ui/scroll-area';
import ChatRoomsCard from '@/components/chat/ChatRooms/ChatRoomsCard';

interface ChatRoomsProps {
  conversations: { id: string; title: string; updatedAt: string }[];
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  handleDeleteConversation: (id: string) => void;
}

export default function ChatRooms({
  conversations,
  selectedConversationId,
  setSelectedConversationId,
  handleDeleteConversation,
}: ChatRoomsProps) {
  return (
    <ScrollArea className="flex-1 px-2">
      <nav className="space-y-1 py-1" aria-label="대화 목록">
        {conversations.map((conversation) => (
          <ChatRoomsCard
            key={conversation.id}
            id={conversation.id}
            title={conversation.title}
            updatedAt={conversation.updatedAt}
            isActive={selectedConversationId === conversation.id}
            onSelect={setSelectedConversationId}
            onDelete={handleDeleteConversation}
          />
        ))}
      </nav>
    </ScrollArea>
  );
}
