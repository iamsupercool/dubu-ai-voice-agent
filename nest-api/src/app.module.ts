import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@common/common.module';
import { ControllersModule } from './controllers/controllers.module';
import { ServicesModule } from '@services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    ServicesModule,
    ControllersModule,
  ],
})
export class AppModule {}
