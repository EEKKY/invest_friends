import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgenticaService } from './agentica.service';
import { AgenticaController } from './agentica.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AgenticaController],
  providers: [AgenticaService],
  exports: [AgenticaService],
})
export class AgenticaModule {}
