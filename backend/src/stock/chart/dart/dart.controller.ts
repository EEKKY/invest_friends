import { Controller, Get, Query, Param } from '@nestjs/common';
import { DartService } from './dart.service';
import { SinglIndxRequest, SinglIndxResponse } from './dto/singl-indx.dto';
import { CorpCodeDto } from './dto/corp-code.dto';
import { CorpCode } from './entities/corp-code.entity';

@Controller('dart')
export class DartController {
  constructor(private readonly dartService: DartService) {}

  @Get('corp-code')
  async getCorpCode(): Promise<CorpCodeDto[]> {
    return this.dartService.getCorpCode();
  }

  @Get('corp-code/:corpCode')
  async getByCorpCode(
    @Param('corpCode') corpCode: number,
  ): Promise<CorpCode | null> {
    return this.dartService.getByCorpCode(corpCode);
  }

  @Get('single-index')
  async getSingleIndex(
    @Query() query: SinglIndxRequest,
  ): Promise<SinglIndxResponse> {
    return this.dartService.getSingleIndex(query);
  }

  @Get('refresh-corp-codes')
  async refreshCorpCodes(): Promise<{ message: string }> {
    await this.dartService.fetchAndStoreCorpCode();
    return { message: 'Corp codes refreshed successfully' };
  }
}
