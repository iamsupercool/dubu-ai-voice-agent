import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: false,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Dubu Voice API')
    .setDescription(
      `
      두부 음성 AI 에이전트 API 문서

      ## 인증 방법
      1. POST /auth/login 으로 로그인 (access_token 반환)
      2. Authorization: Bearer {access_token} 헤더 사용

      ## WebSocket
      - 연결: ws://localhost:3001
      - auth: { token: access_token }
      - 이벤트: voice:message → ai:response
    `,
    )
    .setVersion('1.0')
    .addTag('auth', '인증 관련 API')
    .addTag('conversations', '대화 기록 관련 API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
  console.log('Swagger docs: http://localhost:3001/api-docs');
}
void bootstrap();
