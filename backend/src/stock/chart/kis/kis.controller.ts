import { Controller, Get, Query } from '@nestjs/common';
import { KisService } from './kis.service';
import { ApiResponse } from '@nestjs/swagger';
import {
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
  KisTimeDailyChartResponseDto,
  KisTimeItemChartResponseDto,
  GetPriceRequestDto,
  PriceResponseDto,
} from './dto/kis.dto';

@Controller('kis')
export class KisController {
  constructor(private readonly kisService: KisService) {}

  @Get('price')
  @ApiResponse({ status: 200, type: PriceResponseDto })
  getPrice(@Query() query: GetPriceRequestDto): Promise<PriceResponseDto> {
    return this.kisService.getPrice(query);
  }

  @Get('time-daily-chart')
  @ApiResponse({ status: 200, type: KisTimeDailyChartResponseDto })
  getTimeDailyChart(
    @Query() query: KisTimeDailyChartRequestDto,
  ): Promise<KisTimeDailyChartResponseDto> {
    return this.kisService.getDailyChart(query);
  }

  @Get('time-item-chart')
  @ApiResponse({ status: 200, type: KisTimeItemChartResponseDto })
  getTimeItemChart(
    @Query() query: KisTimeItemChartRequestDto,
  ): Promise<KisTimeItemChartResponseDto> {
    return this.kisService.getItemChart(query);
  }
}
