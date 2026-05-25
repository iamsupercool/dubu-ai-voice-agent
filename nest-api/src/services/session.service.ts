// 슬라이딩 윈도우(최근 20개) 적용 이유:
// Ollama 로컬 모델의 컨텍스트 윈도우 한계를 고려한 설계.

import { Injectable } from '@nestjs/common';

export interface Session {
  userId: string;
  username: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  connectedAt: Date;
  currentConversationId: string | null;
  abortController: AbortController | null;
}

@Injectable()
export class SessionService {
  private sessions = new Map<string, Session>();

  create(socketId: string, user: { id: string; username: string }): void {
    this.sessions.set(socketId, {
      userId: user.id,
      username: user.username,
      history: [],
      connectedAt: new Date(),
      currentConversationId: null,
      abortController: null,
    });
  }

  get(socketId: string): Session | undefined {
    return this.sessions.get(socketId);
  }

  appendMessage(socketId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.history.push({ role, content });
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }
  }

  restoreHistory(
    socketId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    const last20 = messages.slice(-20);
    session.history = last20.map((m) => ({ role: m.role, content: m.content }));
  }

  setAbortController(socketId: string, controller: AbortController): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.abortController = controller;
  }

  clearAbortController(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.abortController = null;
  }

  abort(socketId: string): void {
    const session = this.sessions.get(socketId);
    session?.abortController?.abort();
  }

  setConversationId(socketId: string, conversationId: string): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.currentConversationId = conversationId;
  }

  delete(socketId: string): Session | undefined {
    const session = this.sessions.get(socketId);
    this.sessions.delete(socketId);
    return session;
  }

  getAll(): Map<string, Session> {
    return this.sessions;
  }
}
