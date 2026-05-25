import { useCallback, useEffect, useRef, useState } from 'react';
import Router from 'next/router';
import { io, Socket } from 'socket.io-client';
import { CONFIG } from '@/constants/config';
import { getToken, clearAuth } from '@/lib/auth';

interface UseSocketOptions {
  onConnected?: (data: { username: string }) => void;
  onAiStreamStart?: () => void;
  onAiStreamToken?: (data: { token: string }) => void;
  onAiStreamDone?: (data: { text: string }) => void;
  onAiStreamCancel?: () => void;
  onAiThinking?: (data: { status: boolean }) => void;
  onConversationCreated?: (data: { conversationId: string }) => void;
  onVoiceResumed?: (data: { messages: unknown[]; title: string }) => void;
  onError?: (data: { message: string }) => void;
  onDisconnect?: () => void;
  onAuthError?: () => void;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

export function useRequestSocket(options: UseSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [wsError, setWsError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const isAuthErrorRef = useRef(false);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const createSocket = useCallback((): Socket => {
    const socket = io(CONFIG.WS_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: getToken() },
    });

    socket.on('connect', () => {
      console.log('[WS Client] Connected:', socket.id);
    });

    socket.on('connected', (data: { username: string }) => {
      setConnectionState('connected');
      setWsError(null);
      setReconnectCount(0);
      console.log('[WS Client] Authenticated:', data.username);
      optionsRef.current.onConnected?.(data);
    });

    socket.on('ai:stream:start', () => optionsRef.current.onAiStreamStart?.());
    socket.on('ai:stream:token', (d: { token: string }) => optionsRef.current.onAiStreamToken?.(d));
    socket.on('ai:stream:done', (d: { text: string }) => optionsRef.current.onAiStreamDone?.(d));
    socket.on('ai:stream:cancel', () => optionsRef.current.onAiStreamCancel?.());
    socket.on('ai:thinking', (d: { status: boolean }) => optionsRef.current.onAiThinking?.(d));
    socket.on('conversation:created', (d: { conversationId: string }) =>
      optionsRef.current.onConversationCreated?.(d),
    );
    socket.on('voice:resumed', (d: { messages: unknown[]; title: string }) =>
      optionsRef.current.onVoiceResumed?.(d),
    );

    socket.on('error', (d: { message: string; code?: string }) => {
      if (d.code === 'AUTH_ERROR') {
        isAuthErrorRef.current = true;
        clearAuth();
        optionsRef.current.onAuthError?.();
        setTimeout(() => Router.replace('/'), 1500);
        return;
      }
      setWsError(d.message);
      console.error('[WS Client] Error:', d.message);
      optionsRef.current.onError?.(d);
    });

    socket.on('disconnect', (reason: string) => {
      setConnectionState('disconnected');
      console.log('[WS Client] Disconnected:', reason);

      if (isAuthErrorRef.current) {
        isAuthErrorRef.current = false;
        return;
      }

      optionsRef.current.onDisconnect?.();
      if (!isManualDisconnectRef.current) {
        setReconnectCount((prev) => {
          if (prev < 3) {
            reconnectTimerRef.current = setTimeout(() => {
              console.log(`[WS Client] Reconnect attempt ${prev + 1}/3`);
              socket.connect();
            }, 3000);
            return prev + 1;
          }
          setWsError('재연결에 실패했습니다');
          return prev;
        });
      }
    });

    return socket;
  }, []);

  const connect = useCallback(() => {
    isManualDisconnectRef.current = false;
    setConnectionState('connecting');
    if (!socketRef.current) {
      socketRef.current = createSocket();
    }
    if (!socketRef.current.connected) {
      console.log('[WS Client] Connecting...');
      socketRef.current.connect();
    }
  }, [createSocket]);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnectionState('idle');
    setReconnectCount(0);
    setWsError(null);
  }, []);

  const sendMessage = useCallback((text: string) => {
    socketRef.current?.emit('voice:message', { text });
  }, []);

  const resumeConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('voice:resume', { conversationId });
  }, []);

  const stopStream = useCallback(() => {
    socketRef.current?.emit('voice:stop');
  }, []);

  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  const isConnected = connectionState === 'connected';

  return {
    connectionState,
    isConnected,
    wsError,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    resumeConversation,
    stopStream,
  };
}
