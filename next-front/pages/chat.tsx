import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useConversations, useDeleteConversation } from '@/hooks/useConversations';
import { useEffect, useMemo, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import FullPageLoader from '@/components/common/items/FullPageLoader';
import { Button } from '@/components/common/ui/button';
import ChatRooms from '@/components/chat/ChatRooms/ChatRooms';
import { Separator } from '@/components/common/ui/separator';
import ChatRoom from '@/components/chat/ChatRoom/ChatRoom';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}
export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data, isLoading: isConversationsLoading, refetch } = useConversations();
  const deleteConversation = useDeleteConversation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated()) router.push('/');
  }, [isAuthLoading, router]);

  useEffect(() => {
    if (!router.isReady) return;
    const queryConversationId = router.query.conversationId as string | undefined;
    if (queryConversationId) setSelectedConversationId(queryConversationId);
  }, [router.isReady, router.query.conversationId]);

  const conversations = useMemo<ConversationSummary[]>(
    () =>
      (data ?? []).map((conversation) => ({
        id: conversation.id,
        title: conversation.preview || '대화',
        updatedAt: conversation.endedAt,
      })),
    [data],
  );

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  function handleNewChat() {
    setSelectedConversationId(null);
  }

  function handleDeleteConversation(id: string) {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (selectedConversationId === id) setSelectedConversationId(null);
      },
    });
  }

  async function handleLogout() {
    await logout();
  }

  if (isAuthLoading || isConversationsLoading) return <FullPageLoader />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex h-screen w-[320px] shrink-0 flex-col border-r bg-muted/30">
        <Button onClick={handleNewChat} className="m-3 justify-start gap-2" variant="outline">
          + 새 대화
        </Button>

        <ChatRooms
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          setSelectedConversationId={setSelectedConversationId}
          handleDeleteConversation={handleDeleteConversation}
        />

        <Separator />
        <div className="flex items-center justify-between p-3">
          <span className="truncate text-sm text-muted-foreground">{user?.username ?? ''}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </aside>

      <ChatRoom
        selectedConversationId={selectedConversationId}
        selectedTitle={selectedConversation?.title}
        onConversationCreated={(conversationId: string) => {
          setSelectedConversationId(conversationId);
          refetch();
        }}
      />
    </div>
  );
}
