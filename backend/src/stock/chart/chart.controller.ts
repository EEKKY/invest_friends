import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChartService } from './chart.service';
import {
  GetChartRequestDto,
  ChartResponseDto,
  GetFinancialDataRequestDto,
  FinancialDataResponseDto,
} from './dto/chart.dto';

@ApiTags('Chart')
@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Get('stock')
  @ApiResponse({ status: 200, type: ChartResponseDto })
  async getStockChart(
    @Query() query: GetChartRequestDto,
  ): Promise<ChartResponseDto> {
    return this.chartService.getStockChart(query);
  }

  @Get('financial')
  @ApiResponse({ status: 200, type: FinancialDataResponseDto })
  async getFinancialData(
    @Query() query: GetFinancialDataRequestDto,
  ): Promise<FinancialDataResponseDto> {
    return this.chartService.getFinancialData(query);
  }
}
