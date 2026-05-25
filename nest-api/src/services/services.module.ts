import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from '@services/auth.service';
import { JwtStrategy } from '@common/strategies/jwt.strategy';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { JsonDbService } from '@services/json-db.service';
import { VoiceGateway } from '@gateways/voice.gateway';
import { SessionService } from '@services/session.service';
import { AiService } from '@services/ai.service';
import { MessageQueueService } from '@services/message-queue.service';
import { ConversationsService } from '@services/conversations.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') as StringValue,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    JsonDbService,
    VoiceGateway,
    SessionService,
    AiService,
    MessageQueueService,
    ConversationsService,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtModule,
    JsonDbService,
    ConversationsService,
    SessionService,
    AiService,
    MessageQueueService,
  ],
})
export class ServicesModule {}
