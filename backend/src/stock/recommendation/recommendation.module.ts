import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { KisModule } from '../kis/kis.module';
import { DartModule } from '../dart/dart.module';
import { AgenticaModule } from '../agentica/agentica.module';

@Module({
  imports: [KisModule, DartModule, AgenticaModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}