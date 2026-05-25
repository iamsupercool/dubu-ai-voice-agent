import { AppLogger } from '@common/logger/app.logger';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class CommonModule {}
