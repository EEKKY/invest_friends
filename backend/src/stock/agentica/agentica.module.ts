import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgenticaService } from './agentica.service';
import { AgenticaController } from './agentica.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, ChatModule],
  controllers: [AgenticaController],
  providers: [AgenticaService],
  exports: [AgenticaService],
})
export class AgenticaModule {}
