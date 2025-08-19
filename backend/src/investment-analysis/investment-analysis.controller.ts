import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvestmentAnalysisService } from './investment-analysis.service';
import {
  GetInvestmentAnalysisDto,
  InvestmentAnalysisResponseDto,
} from './dto/investment-analysis.dto';
import { JwtAuthGuard } from '../authguard/jwt.auth';

@ApiTags('Investment Analysis')
@Controller('api/v1/investment-analysis')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentAnalysisController {
  constructor(
    private readonly investmentAnalysisService: InvestmentAnalysisService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '종합 투자 분석 정보 조회',
    description: `
      주식 종목에 대한 종합적인 투자 분석 정보를 제공합니다.
      
      포함되는 정보:
      1. 차트 - 주가/거래량, 기술지표(이평, RSI 등)
      2. 회사정보 - 기업개요, 업종, 상장일, 시총
      3. 투자지표 - PER, PBR, ROE, EPS/BPS
      4. 실적/컨센서스 - 분기/연간 실적, 전망
      5. 배당 - 배당금, 수익률, 일정
      6. 동종업계 비교 - 업종 내 지표/순위
      7. 애널리스트/뉴스 - 리포트 요약, 뉴스 감성
      8. 재무제표 - 손익/재무상태/현금흐름
      9. 리스크/AI 분석 - 변동성, 부채, 민감도
    `,
  })
  @ApiResponse({
    status: 200,
    description: '종합 투자 분석 정보 조회 성공',
    type: InvestmentAnalysisResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '종목을 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async getInvestmentAnalysis(
    @Query() dto: GetInvestmentAnalysisDto,
  ): Promise<InvestmentAnalysisResponseDto> {
    return this.investmentAnalysisService.getInvestmentAnalysis(dto);
  }

  @Get('chart')
  @ApiOperation({
    summary: '차트 데이터만 조회',
    description: '주가 차트와 기술지표 데이터만 조회합니다.',
  })
  async getChartOnly(@Query('stockCode') stockCode: string) {
    return this.investmentAnalysisService.getInvestmentAnalysis({
      stockCode,
      sections: 'chart',
    });
  }

  @Get('metrics')
  @ApiOperation({
    summary: '투자 지표만 조회',
    description: 'PER, PBR, ROE 등 투자 지표만 조회합니다.',
  })
  async getMetricsOnly(@Query('stockCode') stockCode: string) {
    return this.investmentAnalysisService.getInvestmentAnalysis({
      stockCode,
      sections: 'metrics',
    });
  }

  @Get('financial')
  @ApiOperation({
    summary: '재무제표만 조회',
    description: '손익계산서, 재무상태표, 현금흐름표를 조회합니다.',
  })
  async getFinancialOnly(@Query('stockCode') stockCode: string) {
    return this.investmentAnalysisService.getInvestmentAnalysis({
      stockCode,
      sections: 'financial',
    });
  }

  @Get('news')
  @ApiOperation({
    summary: '뉴스/애널리스트 리포트만 조회',
    description: '최신 뉴스와 애널리스트 리포트를 조회합니다.',
  })
  async getNewsOnly(@Query('stockCode') stockCode: string) {
    return this.investmentAnalysisService.getInvestmentAnalysis({
      stockCode,
      sections: 'news',
    });
  }

  @Get('risk')
  @ApiOperation({
    summary: '리스크 분석만 조회',
    description: '변동성과 리스크 지표를 조회합니다.',
  })
  async getRiskOnly(@Query('stockCode') stockCode: string) {
    return this.investmentAnalysisService.getInvestmentAnalysis({
      stockCode,
      sections: 'risk',
    });
  }
}
