import { Module } from '@nestjs/common';
import { DartModule } from './dart/dart.module';
import { KisModule } from './kis/kis.module';
import { ChartModule } from './chart/chart.module';

@Module({
  imports: [DartModule, KisModule, ChartModule],
})
export class StockModule {}
