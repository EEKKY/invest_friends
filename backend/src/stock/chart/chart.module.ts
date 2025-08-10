import { Module } from '@nestjs/common';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import { KisModule } from './kis/kis.module';
import { DartModule } from './dart/dart.module';

@Module({
  imports: [KisModule, DartModule],
  controllers: [ChartController],
  providers: [ChartService],
  exports: [ChartService],
})
export class ChartModule {}
