import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JsonDbService } from '@services/json-db.service';
import { Message } from '@common/interfaces/conversation.interface';
import { ConversationResponseDto } from '@common/dto/conversation/conversation-response.dto';
import { ConversationDetailResponseDto } from '@common/dto/conversation/conversation-detail-response.dto';

interface ConversationIndex {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ConversationDetail {
  id: string;
  title: string;
  username: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly jsonDbService: JsonDbService) {}

  createConversation(dto: { userId: string; username: string; firstMessage: string }): string {
    const id = uuidv4();
    const now = new Date().toISOString();
    const raw = dto.firstMessage;
    const title = raw.length > 30 ? raw.slice(0, 30) : raw;

    const detail: ConversationDetail = {
      id,
      title,
      username: dto.username,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.jsonDbService.ensureDir(this.jsonDbService.getUserConversationsDir(dto.userId));
    this.jsonDbService.writeJson(this.jsonDbService.getConversationPath(dto.userId, id), detail);

    const indexPath = this.jsonDbService.getUserIndexPath(dto.userId);
    const index = this.jsonDbService.readJson<ConversationIndex[]>(indexPath);
    index.push({ id, title, createdAt: now, updatedAt: now, messageCount: 0 });
    this.jsonDbService.writeJson(indexPath, index);

    return id;
  }

  appendMessage(
    conversationId: string,
    userId: string,
    message: { role: 'user' | 'assistant'; content: string; timestamp: string },
  ): void {
    const detailPath = this.jsonDbService.getConversationPath(userId, conversationId);
    const detail = this.jsonDbService.readJson<ConversationDetail | null>(detailPath);
    if (!detail || !detail?.id) return;

    detail.messages.push(message);
    detail.updatedAt = message.timestamp;
    this.jsonDbService.writeJson(detailPath, detail);

    const indexPath = this.jsonDbService.getUserIndexPath(userId);
    const index = this.jsonDbService.readJson<ConversationIndex[]>(indexPath);
    const entry = index.find((e) => e.id === conversationId);
    if (entry) {
      entry.updatedAt = message.timestamp;
      entry.messageCount = detail.messages.length;
      this.jsonDbService.writeJson(indexPath, index);
    }
  }

  findByUser(userId: string): ConversationResponseDto[] {
    const indexPath = this.jsonDbService.getUserIndexPath(userId);
    const index = this.jsonDbService.readJson<ConversationIndex[]>(indexPath);
    if (!index) {
      return [] as ConversationResponseDto[];
    }
    return index
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((entry) => ({
        id: entry.id,
        username: userId,
        messageCount: entry.messageCount,
        startedAt: entry.createdAt,
        endedAt: entry.updatedAt,
        preview: entry.title,
      }));
  }

  findOne(
    id: string,
    userId: string,
    size = 30,
    before?: string,
  ): ConversationDetailResponseDto | null {
    const detail = this.jsonDbService.readJson<ConversationDetail | null>(
      this.jsonDbService.getConversationPath(userId, id),
    );
    if (!detail || !detail?.id) return null;

    let msgs = detail.messages;
    if (before) {
      msgs = msgs.filter((m) => m.timestamp < before);
    }

    const hasMore = msgs.length > size;
    const paged = hasMore ? msgs.slice(msgs.length - size) : msgs;

    return {
      id: detail.id,
      title: detail.title,
      username: detail.username,
      messages: paged,
      startedAt: detail.createdAt,
      endedAt: detail.updatedAt,
      messageCount: detail.messages.length,
      hasMore,
    };
  }

  updateConversation(
    conversationId: string,
    userId: string,
    newMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): void {
    const detailPath = this.jsonDbService.getConversationPath(userId, conversationId);
    const detail = this.jsonDbService.readJson<ConversationDetail | null>(detailPath);
    if (!detail || !detail?.id) {
      throw new NotFoundException(`대화를 찾을 수 없습니다: ${conversationId}`);
    }

    const now = new Date().toISOString();
    const appended: Message[] = newMessages.map((m) => ({
      ...m,
      timestamp: now,
    }));

    detail.messages = [...detail.messages, ...appended];
    detail.updatedAt = now;
    this.jsonDbService.writeJson(detailPath, detail);

    const indexPath = this.jsonDbService.getUserIndexPath(userId);
    const index = this.jsonDbService.readJson<ConversationIndex[]>(indexPath);
    const entry = index.find((e) => e.id === conversationId);
    if (entry) {
      entry.updatedAt = now;
      entry.messageCount = detail.messages.length;
      this.jsonDbService.writeJson(indexPath, index);
    }
  }

  deleteOne(id: string, userId: string): boolean {
    const detailPath = this.jsonDbService.getConversationPath(userId, id);
    try {
      if (existsSync(detailPath)) unlinkSync(detailPath);
    } catch {
      // 파일 삭제 실패와 무관하게 index 정리는 계속 진행한다.
    }

    const indexPath = this.jsonDbService.getUserIndexPath(userId);
    const index = this.jsonDbService.readJson<ConversationIndex[]>(indexPath);
    const before = index.length;
    const filtered = index.filter((entry) => entry.id !== id);
    this.jsonDbService.writeJson(indexPath, filtered);

    return filtered.length < before;
  }
}
