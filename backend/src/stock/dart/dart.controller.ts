import { Controller, Get, Query, Param } from '@nestjs/common';
import { DartService } from './dart.service';
import { SinglIndxRequest, SinglIndxResponse } from './dto/singl-indx.dto';
import { CorpCodeDto } from './dto/corp-code.dto';
import {
  FinancialDataRequestDto,
  FinancialDataResponseDto,
} from './dto/financialData.dto';

@Controller('dart')
export class DartController {
  constructor(private readonly dartService: DartService) {}

  @Get('corp-code')
  async getCorpCode(): Promise<CorpCodeDto[]> {
    return this.dartService.getCorpCode();
  }

  @Get('corp-code/:corpCode')
  async getByCorpCode(@Param('corpCode') corpCode: string) {
    return this.dartService.getByCorpCode(corpCode);
  }

  @Get('single-index')
  async getSingleIndex(
    @Query() query: SinglIndxRequest,
  ): Promise<SinglIndxResponse> {
    return this.dartService.getSingleIndex(query);
  }

  @Get('refresh-corp-codes')
  async refreshCorpCodes() {
    return this.dartService.refreshCorpCodes();
  }

  @Get('financial')
  async getFinancialData(
    @Query() query: FinancialDataRequestDto,
  ): Promise<FinancialDataResponseDto> {
    return this.dartService.getFinancialStatements(query);
  }
}
