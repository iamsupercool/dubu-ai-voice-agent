import * as fs from 'fs';
import * as path from 'path';
import { AppLogger } from '@common/logger/app.logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonDbService {
  dataDir = path.join(process.cwd(), 'data');

  appLogger = new AppLogger();

  readJson<T>(filePath: string): T {
    try {
      const content = fs.readFileSync(`${filePath}`, 'utf-8').trim();
      if (!content) {
        this.appLogger.logErrorMessage(`${filePath} is empty`);
        return [] as unknown as T;
      }
      return JSON.parse(content) as T;
    } catch (e) {
      this.appLogger.logErrorMessage(e);
      return [] as unknown as T;
    }
  }

  writeJson<T>(filePath: string, data: T): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  getUsersDir(): string {
    return path.join(this.dataDir, 'users.json');
  }

  getUserConversationsDir(userId: string): string {
    return path.join(this.dataDir, 'conversations', userId);
  }

  getUserIndexPath(userId: string): string {
    return path.join(this.getUserConversationsDir(userId), 'index.json');
  }

  getConversationPath(userId: string, conversationId: string): string {
    return path.join(this.getUserConversationsDir(userId), `${conversationId}.json`);
  }
}
