import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '@services/session.service';
import { AiService } from '@services/ai.service';
import { MessageQueueService } from '@services/message-queue.service';
import { ConversationsService } from '@services/conversations.service';
import { AppLogger } from '@common/logger/app.logger';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: false },
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new AppLogger();

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly aiService: AiService,
    private readonly messageQueueService: MessageQueueService,
    private readonly conversationsService: ConversationsService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.emit('error', { message: '인증이 필요합니다' });
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        username: string;
      }>(token);
      this.sessionService.create(client.id, {
        id: payload.sub,
        username: payload.username,
      });
      this.logger.logWsConnect(client.id, payload.username);
      client.emit('connected', { username: payload.username });
    } catch (err: any) {
      const message =
        err?.name === 'TokenExpiredError' ? '토큰이 만료되었습니다' : '토큰이 유효하지 않습니다';
      client.emit('error', { message, code: 'AUTH_ERROR' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.messageQueueService.clear(client.id);
    const session = this.sessionService.delete(client.id);
    if (session) {
      this.logger.logWsDisconnect(client.id, session.username);
    }
  }

  // handleVoiceMessage에서 await 제거 이유:
  // 각 소켓(탭)의 AI 처리를 독립적인 비동기 작업으로 분리.
  @SubscribeMessage('voice:message')
  handleVoiceMessage(@MessageBody() data: { text: string }, @ConnectedSocket() client: Socket) {
    this.messageQueueService.enqueue(client.id, () => this.processMessage(data, client));
  }

  private async processMessage(data: { text: string }, client: Socket): Promise<void> {
    const session = this.sessionService.get(client.id);
    if (!session) {
      client.emit('error', { message: '세션이 없습니다' });
      return;
    }

    if (!data.text?.trim()) {
      client.emit('error', { message: '텍스트가 없습니다' });
      return;
    }

    this.logger.logWsMessage(client.id, 'voice:message', { text: data.text });

    if (!session.currentConversationId) {
      const convId = this.conversationsService.createConversation({
        userId: session.userId,
        username: session.username,
        firstMessage: data.text,
      });
      this.sessionService.setConversationId(client.id, convId);
      client.emit('conversation:created', { conversationId: convId });
    }

    this.sessionService.appendMessage(client.id, 'user', data.text);

    this.conversationsService.appendMessage(session.currentConversationId!, session.userId, {
      role: 'user',
      content: data.text,
      timestamp: new Date().toISOString(),
    });

    const controller = new AbortController();
    this.sessionService.setAbortController(client.id, controller);

    client.emit('ai:thinking', { status: true });
    client.emit('ai:stream:start');

    await this.aiService.chatStream(
      session.history,
      data.text,
      (token: string) => {
        client.emit('ai:stream:token', { token });
      },
      async (fullText: string, aborted: boolean) => {
        this.sessionService.clearAbortController(client.id);

        if (aborted && !fullText) {
          client.emit('ai:stream:cancel');
          client.emit('ai:thinking', { status: false });
          return;
        }

        this.sessionService.appendMessage(client.id, 'assistant', fullText);

        this.conversationsService.appendMessage(session.currentConversationId!, session.userId, {
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toISOString(),
        });

        client.emit('ai:stream:done', { text: fullText });
        client.emit('ai:thinking', { status: false });
        this.logger.logWsResponse(client.id, 'ai:stream:done', {
          length: fullText.length,
        });
      },
      (error: string) => {
        this.sessionService.clearAbortController(client.id);
        client.emit('error', { message: error });
        client.emit('ai:thinking', { status: false });
        this.logger.logErrorMessage({
          text: 'AI에 연결할 수 없습니다. Ollama 실행을 확인해주세요.',
        });
      },
      controller.signal,
    );
  }

  @SubscribeMessage('voice:resume')
  handleResume(@MessageBody() data: { conversationId: string }, @ConnectedSocket() client: Socket) {
    const session = this.sessionService.get(client.id);
    if (!session) {
      client.emit('error', { message: '세션이 없습니다' });
      return;
    }

    const conversation = this.conversationsService.findOne(data.conversationId, session.userId);

    if (!conversation) {
      client.emit('error', { message: '대화를 찾을 수 없습니다' });
      return;
    }

    this.sessionService.restoreHistory(client.id, conversation.messages);
    this.sessionService.setConversationId(client.id, data.conversationId);

    client.emit('voice:resumed', {
      conversationId: data.conversationId,
      messages: conversation.messages,
      title: conversation.title,
    });

    this.logger.logWsMessage(client.id, 'voice:resumed', {
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('voice:stop')
  handleStop(@ConnectedSocket() client: Socket) {
    this.sessionService.abort(client.id);
  }

  @SubscribeMessage('voice:ping')
  handlePing(@ConnectedSocket() _client: Socket) {
    return { event: 'voice:pong', data: { timestamp: Date.now() } };
  }
}
