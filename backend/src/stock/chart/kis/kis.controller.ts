import { Controller, Get, Query } from '@nestjs/common';
import { KisService } from './kis.service';
import { 
  ApiResponse, 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiQuery,
  ApiExtraModels
} from '@nestjs/swagger';
import {
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
  KisTimeDailyChartResponseDto,
  KisTimeItemChartResponseDto,
  GetPriceRequestDto,
  PriceResponseDto,
} from './dto/kis.dto';

@ApiTags('kis')
@Controller('kis')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PriceResponseDto, KisTimeDailyChartResponseDto, KisTimeItemChartResponseDto)
export class KisController {
  constructor(private readonly kisService: KisService) {}

  @Get('price')
  @ApiOperation({ 
    summary: '주식 현재가 조회',
    description: '한국투자증권 API를 통해 주식의 현재가 정보를 조회합니다. KOSPI/KOSDAQ 종목의 실시간 가격, 거래량, 등락률 등을 제공합니다.',
  })
  @ApiResponse({ 
    status: 200, 
    type: PriceResponseDto,
    description: '주식 현재가 정보 조회 성공' 
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - KIS API 토큰이 유효하지 않음' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'KIS API 서버 오류' 
  })
  getPrice(@Query() query: GetPriceRequestDto): Promise<PriceResponseDto> {
    return this.kisService.getPrice(query);
  }

  @Get('time-daily-chart')
  @ApiOperation({ 
    summary: '일봉 차트 데이터 조회',
    description: '지정된 기간의 일봉 차트 데이터를 조회합니다. 일별 시가, 고가, 저가, 종가, 거래량 정보를 포함합니다. @deprecated 대신 /chart/stock API를 사용하세요.',
    deprecated: true
  })
  @ApiResponse({ 
    status: 200, 
    type: KisTimeDailyChartResponseDto,
    description: '일봉 차트 데이터 조회 성공' 
  })
  getTimeDailyChart(
    @Query() query: KisTimeDailyChartRequestDto,
  ): Promise<KisTimeDailyChartResponseDto> {
    return this.kisService.getDailyChart(query);
  }

  @Get('time-item-chart')
  @ApiOperation({ 
    summary: '분봉 차트 데이터 조회',
    description: '당일 분봉(30분 단위) 차트 데이터를 조회합니다. 주식과 지수(KOSPI/KOSDAQ) 모두 지원하며, 실시간에 가까운 거래 데이터를 제공합니다.',
  })
  @ApiResponse({ 
    status: 200, 
    type: KisTimeItemChartResponseDto,
    description: '분봉 차트 데이터 조회 성공' 
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 - 종목 코드 또는 파라미터 오류' 
  })
  getTimeItemChart(
    @Query() query: KisTimeItemChartRequestDto,
  ): Promise<KisTimeItemChartResponseDto> {
    return this.kisService.getItemChart(query);
  }
}
