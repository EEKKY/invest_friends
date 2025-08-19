import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgenticaController } from './chat.controller';
import { KisModule } from '../kis/kis.module';
import { DartModule } from '../dart/dart.module';
import { AgenticaService } from './chat.service';

@Module({
  imports: [ConfigModule, KisModule, DartModule],
  controllers: [AgenticaController],
  providers: [AgenticaService],
  exports: [AgenticaService],
})
export class AgenticaModule {}