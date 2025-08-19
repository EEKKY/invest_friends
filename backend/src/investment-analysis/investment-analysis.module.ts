import { Module } from '@nestjs/common';
import { InvestmentAnalysisService } from './investment-analysis.service';
import { InvestmentAnalysisController } from './investment-analysis.controller';
import { KisModule } from '../stock/kis/kis.module';
import { DartModule } from '../stock/dart/dart.module';
import { AgenticaModule } from '../stock/agentica/agentica.module';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorpCode } from '../stock/dart/entities/corp-code.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    KisModule,
    DartModule,
    AgenticaModule,
    HttpModule,
    TypeOrmModule.forFeature([CorpCode]),
    CacheModule.register({
      ttl: 60, // 60 seconds cache
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [InvestmentAnalysisController],
  providers: [InvestmentAnalysisService],
  exports: [InvestmentAnalysisService],
})
export class InvestmentAnalysisModule {}