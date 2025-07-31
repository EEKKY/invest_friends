import { Controller, Get, Query } from '@nestjs/common';
import { KisService } from './kis.service';
import { ApiResponse } from '@nestjs/swagger';
import { 
  GetPriceRequestDto, 
  PriceResponseDto,
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
  KisTimeDailyChartResponseDto,
  KisTimeItemChartResponseDto,
  KisIndexChartRequestDto,
  KisIndexChartResponseDto
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
  getTimeDailyChart(@Query() query: KisTimeDailyChartRequestDto): Promise<KisTimeDailyChartResponseDto> {
    return this.kisService.getTimeDailyChart(query);
  }

  @Get('time-item-chart')
  @ApiResponse({ status: 200, type: KisTimeItemChartResponseDto })
  getTimeItemChart(@Query() query: KisTimeItemChartRequestDto): Promise<KisTimeItemChartResponseDto> {
    return this.kisService.getTimeItemChart(query);
  }

  @Get('index-chart')
  @ApiResponse({ status: 200, type: KisIndexChartResponseDto })
  getIndexChart(@Query() query: KisIndexChartRequestDto): Promise<KisIndexChartResponseDto> {
    return this.kisService.getIndexChart(query);
  }
}
