import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/app.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly appLogger = new AppLogger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const start = Date.now();

    this.appLogger.logRequest(method, url, body);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        this.appLogger.logResponse(method, url, res.statusCode, Date.now() - start);
      }),
    );
  }
}
