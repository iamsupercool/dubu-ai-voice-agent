// 같은 탭(socketId)에서는 메시지 순서 보장.
// 다른 탭(socketId)끼리는 완전 병렬 처리.
// Promise 체이닝으로 별도 라이브러리 없이 구현.

import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageQueueService {
  private queues = new Map<string, Promise<void>>();

  enqueue(socketId: string, task: () => Promise<void>): void {
    const current = this.queues.get(socketId) ?? Promise.resolve();
    const next = current.then(task).catch(() => {});
    this.queues.set(socketId, next);
  }

  clear(socketId: string): void {
    this.queues.delete(socketId);
  }
}
