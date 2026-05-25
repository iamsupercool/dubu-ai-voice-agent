import { Logger } from '@nestjs/common';

export class AppLogger {
  private readonly logger = new Logger(AppLogger.name);

  logRequest(method: string, url: string, body: unknown): void {
    this.logger.log(`[HTTP Request] ${method} ${url} — body: ${JSON.stringify(body)}`);
  }

  logResponse(method: string, url: string, statusCode: number, duration: number): void {
    this.logger.log(`[HTTP Response] ${method} ${url} ${statusCode} — ${duration}ms`);
  }

  logWsConnect(socketId: string, username: string): void {
    this.logger.log(`[WS Server] Connected — socketId: ${socketId}, user: ${username}`);
  }

  logWsDisconnect(socketId: string, username: string): void {
    this.logger.log(`[WS Server] Disconnected — socketId: ${socketId}, user: ${username}`);
  }

  logWsMessage(socketId: string, event: string, data: unknown): void {
    this.logger.log(
      `[WS Server] Message — socketId: ${socketId}, event: ${event}, data: ${JSON.stringify(data)}`,
    );
  }

  logWsResponse(socketId: string, event: string, data: unknown): void {
    this.logger.log(
      `[WS Server] Response — socketId: ${socketId}, event: ${event}, data: ${JSON.stringify(data)}`,
    );
  }

  logErrorMessage(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(error.message, error.stack);
      return;
    }

    this.logger.error(String(error));
  }
}
