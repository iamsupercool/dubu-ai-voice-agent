import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ChatRoomHeader from '@/components/chat/ChatRoom/ChatRoomHeader';
import ChatRoomMessagePanel from '@/components/chat/ChatRoom/ChatRoomMessage/ChatRoomMessagePanel';
import ChatRoomInputArea from '@/components/chat/ChatRoom/ChatRoomInputArea';
import { useRequestSocket } from '@/hooks/useRequestSocket';
import { useSpeech } from '@/hooks/useSpeech';
import apiClient from '@/lib/apiClient';
import { Message } from '@/interfaces/Chat/Message.interface';

interface ChatRoomProps {
  selectedConversationId: string | null;
  selectedTitle?: string;
  onConversationCreated: (conversationId: string) => void;
}

interface ConversationDetail {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  hasMore: boolean;
}

const toMessage = (
  message: ConversationDetail['messages'][number],
  prefix: string,
  index: number,
): Message => ({
  id: `${prefix}-${message.timestamp}-${index}`,
  role: message.role,
  text: message.content,
  timestamp: new Date(message.timestamp),
});

export default function ChatRoom({
  selectedConversationId,
  selectedTitle,
  onConversationCreated,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [inputResetVersion, setInputResetVersion] = useState(0);

  const pendingMessageRef = useRef<string | null>(null);
  const resumeConversationIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const isIntentionalDisconnectRef = useRef(false);

  const {
    transcript,
    isListening,
    micStatus,
    voiceLevel,
    isSupported,
    startListening,
    stopListening,
    resetListening,
    pushToken,
    flushSpeech,
  } = useSpeech();

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const resetInputAndSpeech = useCallback(() => {
    resetListening();
    window.speechSynthesis?.cancel();
    setInputResetVersion((version) => version + 1);
    setStreamingMessageId(null);
    setIsThinking(false);
    pendingMessageRef.current = null;
  }, [resetListening]);

  const resetRoom = useCallback(() => {
    resetInputAndSpeech();
    setMessages([]);
    setActiveConversationId(null);
    setHasMore(false);
    setIsLoadingMore(false);
    setIsResuming(false);
    resumeConversationIdRef.current = null;
  }, [resetInputAndSpeech]);

  const {
    connectionState,
    isConnected,
    wsError,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    resumeConversation,
    stopStream,
  } = useRequestSocket({
    onAiStreamStart: useCallback(() => {
      const id = `streaming-${Date.now()}`;
      setStreamingMessageId(id);
      setMessages((prev) => [...prev, { id, role: 'assistant', text: '', timestamp: new Date() }]);
    }, []),
    onAiStreamToken: useCallback(
      (data: { token: string }) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== 'assistant') return prev;
          return [...prev.slice(0, -1), { ...last, text: last.text + data.token }];
        });
        pushToken(data.token);
      },
      [pushToken],
    ),
    onAiStreamDone: useCallback(() => {
      setStreamingMessageId(null);
      flushSpeech();
    }, [flushSpeech]),
    onAiStreamCancel: useCallback(() => {
      setStreamingMessageId((prev) => {
        setMessages((items) => {
          const bubble = items.find((item) => item.id === prev);
          return bubble?.text ? items : items.filter((item) => item.id !== prev);
        });
        return null;
      });
      setIsThinking(false);
      window.speechSynthesis?.cancel();
    }, []),
    onAiThinking: useCallback((data: { status: boolean }) => {
      setIsThinking(data.status);
    }, []),
    onVoiceResumed: useCallback(() => {
      setIsResuming(false);
    }, []),
    onConversationCreated: useCallback(
      (data: { conversationId: string }) => {
        setActiveConversationId(data.conversationId);
        onConversationCreated(data.conversationId);
      },
      [onConversationCreated],
    ),
    onError: useCallback(() => {
      setIsResuming(false);
    }, []),
    onDisconnect: useCallback(() => {
      const activeId = activeConversationIdRef.current;
      if (!isIntentionalDisconnectRef.current && activeId) {
        resumeConversationIdRef.current = activeId;
        toast.error('연결이 끊겼습니다', { description: '자동으로 재연결을 시도합니다' });
      }
      isIntentionalDisconnectRef.current = false;
    }, []),
    onAuthError: useCallback(() => {
      toast.error('인증이 만료되었습니다', { description: '로그인 페이지로 이동합니다' });
    }, []),
  });

  useEffect(() => {
    return () => {
      isIntentionalDisconnectRef.current = true;
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (!selectedConversationId) {
      isIntentionalDisconnectRef.current = true;
      disconnect();
      resetRoom();
      return;
    }

    let ignore = false;

    async function loadConversation() {
      resetInputAndSpeech();
      setIsResuming(true);
      setMessages([]);
      resumeConversationIdRef.current = selectedConversationId;
      isIntentionalDisconnectRef.current = true;
      disconnect();

      let success = false;
      try {
        const { data } = await apiClient.get<ConversationDetail>(
          `/conversations/${selectedConversationId}?size=30`,
        );
        if (ignore) return;
        setMessages(data.messages.map((message, index) => toMessage(message, 'resume', index)));
        setHasMore(data.hasMore);
        success = true;
      } catch (error) {
        console.error('[ChatRoom loadConversation]', error);
      } finally {
        if (!ignore) setIsResuming(false);
      }

      // API 완료 후 소켓 연결 (새 대화는 handleSend에서 connect)
      if (success && !ignore) {
        setActiveConversationId(selectedConversationId);
        connect();
      }
    }

    loadConversation();

    return () => {
      ignore = true;
    };
  }, [disconnect, resetInputAndSpeech, resetRoom, selectedConversationId]);

  useEffect(() => {
    if (!isConnected) return;

    if (pendingMessageRef.current) {
      sendMessage(pendingMessageRef.current);
      pendingMessageRef.current = null;
      return;
    }

    if (resumeConversationIdRef.current) {
      resumeConversation(resumeConversationIdRef.current);
      resumeConversationIdRef.current = null;
    }
  }, [isConnected, resumeConversation, sendMessage]);

  const addMessage = useCallback((role: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, text, timestamp: new Date() },
    ]);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !activeConversationId || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const before = encodeURIComponent(messages[0].timestamp.toISOString());
      const { data } = await apiClient.get<ConversationDetail>(
        `/conversations/${activeConversationId}?size=30&before=${before}`,
      );
      setMessages((prev) => [
        ...data.messages.map((message, index) => toMessage(message, 'older', index)),
        ...prev,
      ]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('[ChatRoom handleLoadMore]', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeConversationId, hasMore, isLoadingMore, messages]);

  function handleSend(text: string) {
    setScrollTrigger((trigger) => trigger + 1);
    addMessage('user', text);

    if (!isConnected) {
      pendingMessageRef.current = text;
      connect();
      return;
    }

    sendMessage(text);
  }

  const hasActiveConversation = messages.length > 0 || Boolean(activeConversationId);
  const previewMessage = isListening && transcript ? transcript : undefined;
  const isSocketUnavailable =
    hasActiveConversation && !isConnected && connectionState !== 'connecting' && !isResuming;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="채팅">
      <ChatRoomHeader title={selectedTitle ?? '새 대화'} connectionState={connectionState} />

      <section className="relative flex-1 overflow-hidden" aria-label="대화 내용">
        <ChatRoomMessagePanel
          messages={messages}
          isResuming={isResuming}
          isThinking={isThinking}
          streamingMessageId={streamingMessageId}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          scrollTrigger={scrollTrigger}
          previewMessage={previewMessage}
          conversationKey={activeConversationId ?? 'new'}
          onLoadMore={handleLoadMore}
        />
      </section>

      <section aria-label="메시지 입력">
        <ChatRoomInputArea
          onSendText={handleSend}
          onStopAnswer={stopStream}
          isStreaming={streamingMessageId !== null}
          startListening={startListening}
          stopListening={stopListening}
          isListening={isListening}
          micStatus={micStatus}
          isThinking={isThinking}
          voiceLevel={voiceLevel}
          wsError={wsError}
          connectionError={isSocketUnavailable ? '연결이 끊겼습니다' : null}
          reconnectCount={reconnectCount}
          isReconnecting={reconnectCount > 0 && connectionState !== 'connected'}
          onReconnect={connect}
          canSend={!isResuming && (!hasActiveConversation || isConnected)}
          isSupported={isSupported}
          resetKey={`${activeConversationId ?? 'new'}:${inputResetVersion}`}
        />
      </section>
    </main>
  );
}
