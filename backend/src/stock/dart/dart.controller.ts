import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DartService } from './dart.service';
import { SinglIndxRequest, SinglIndxResponse } from './dto/singl-indx.dto';
import { CorpCodeDto } from './dto/corp-code.dto';
import {
  FinancialDataRequestDto,
  FinancialDataResponseDto,
} from './dto/financialData.dto';

@ApiTags('DART API')
@Controller('dart')
export class DartController {
  constructor(private readonly dartService: DartService) {}

  @Get('corp-code')
  @ApiOperation({ summary: 'Get all corporation codes' })
  async getCorpCode(): Promise<CorpCodeDto[]> {
    return this.dartService.getCorpCode();
  }

  @Get('corp-code/:corpCode')
  @ApiOperation({ summary: 'Get corporation by code' })
  async getByCorpCode(@Param('corpCode') corpCode: string) {
    return this.dartService.getByCorpCode(corpCode);
  }

  @Get('single-index')
  @ApiOperation({ summary: 'Get single index data' })
  async getSingleIndex(
    @Query() query: SinglIndxRequest,
  ): Promise<SinglIndxResponse> {
    return this.dartService.getSingleIndex(query);
  }

  @Get('refresh-corp-codes')
  @ApiOperation({ summary: 'Refresh corporation codes from DART' })
  async refreshCorpCodes() {
    return this.dartService.refreshCorpCodes();
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial statements' })
  async getFinancialData(
    @Query() query: FinancialDataRequestDto,
  ): Promise<FinancialDataResponseDto> {
    return this.dartService.getFinancialStatements(query);
  }

  @Get('dividend')
  @ApiOperation({ 
    summary: 'Get dividend information',
    description: 'Fetches dividend data from DART API including current and previous year dividends'
  })
  @ApiQuery({ 
    name: 'corpCode', 
    required: true, 
    description: 'Corporation code (8 digits)',
    example: '00126380'
  })
  @ApiQuery({ 
    name: 'year', 
    required: false, 
    description: 'Year for dividend data (defaults to current year)',
    example: 2024
  })
  async getDividendInfo(
    @Query('corpCode') corpCode: string,
    @Query('year') year?: number,
  ) {
    return this.dartService.getDividendInfo({
      corpCode,
      year: year ? Number(year) : undefined,
    });
  }
}
