import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgenticaService } from './agentica.service';
import { AgenticaController } from './agentica.controller';
import { KisModule } from '../stock/chart/kis/kis.module';
import { DartModule } from '../stock/chart/dart/dart.module';

@Module({
  imports: [
    ConfigModule,
    KisModule,
    DartModule,
  ],
  controllers: [AgenticaController],
  providers: [AgenticaService],
  exports: [AgenticaService],
})
export class AgenticaModule {}