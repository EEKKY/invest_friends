import { Controller, Get, Query } from '@nestjs/common';
import { KisService } from './kis.service';
import { ApiResponse } from '@nestjs/swagger';
import { GetPriceRequestDto, PriceResponseDto } from './dto/get-price.dto';

@Controller('kis')
export class KisController {
  constructor(private readonly kisService: KisService) {}

  @Get('price')
  @ApiResponse({ status: 200, type: PriceResponseDto })
  getPrice(@Query() query: GetPriceRequestDto): Promise<PriceResponseDto> {
    return this.kisService.getPrice(query);
  }
}
