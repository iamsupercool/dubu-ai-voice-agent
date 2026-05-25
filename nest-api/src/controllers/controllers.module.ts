import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { ConversationsController } from './conversatsions/conversations.controller';
import { ServicesModule } from '@services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [AuthController, ConversationsController],
})
export class ControllersModule {}
