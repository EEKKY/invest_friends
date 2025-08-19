import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

import { KisTimeDailyChartResponseData, KisTimeItemChartResponseData } from '../../stock/kis/dto/kis.dto';

export class ChartDataDto {
  @ApiProperty({ description: '일별 차트 데이터 (KIS 형식)' })
  dailyChart: KisTimeDailyChartResponseData;

  @ApiProperty({ description: '시간별 차트 데이터 (KIS 형식)', required: false })
  @IsOptional()
  itemChart?: KisTimeItemChartResponseData;

  @ApiProperty({ description: '인덱스 차트 데이터 (KOSPI/KOSDAQ)', required: false })
  @IsOptional()
  indexChart?: KisTimeDailyChartResponseData;

  @ApiProperty({ description: '이동평균선 데이터', required: false })
  @IsOptional()
  movingAverages?: {
    ma5?: number[];
    ma20?: number[];
    ma60?: number[];
  };

  @ApiProperty({ description: '기술지표', required: false })
  @IsOptional()
  technicalIndicators?: {
    rsi?: number[];
    macd?: number[];
    bollinger?: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
  };
}

export class CompanyInfoDto {
  @ApiProperty({ description: '종목코드' })
  stockCode: string;

  @ApiProperty({ description: '기업명' })
  companyName: string;

  @ApiProperty({ description: '업종' })
  industry: string;

  @ApiProperty({ description: '상장일' })
  listingDate: string;

  @ApiProperty({ description: '시가총액' })
  marketCap: number;

  @ApiProperty({ description: '발행주식수' })
  sharesOutstanding: number;

  @ApiProperty({ description: '기업개요' })
  description: string;

  @ApiProperty({ description: '대표이사' })
  ceo: string;

  @ApiProperty({ description: '홈페이지' })
  website: string;
}

export class InvestmentMetricsDto {
  @ApiProperty({ description: 'PER (주가수익비율)' })
  per: number;

  @ApiProperty({ description: 'PBR (주가순자산비율)' })
  pbr: number;

  @ApiProperty({ description: 'ROE (자기자본이익률)' })
  roe: number;

  @ApiProperty({ description: 'EPS (주당순이익)' })
  eps: number;

  @ApiProperty({ description: 'BPS (주당순자산)' })
  bps: number;

  @ApiProperty({ description: '부채비율' })
  debtRatio: number;

  @ApiProperty({ description: '유동비율' })
  currentRatio: number;

  @ApiProperty({ description: '영업이익률' })
  operatingMargin: number;
}

export class PerformanceConsensusDto {
  @ApiProperty({ description: '분기별 실적' })
  quarterlyResults: Array<{
    period: string;
    revenue: number;
    operatingProfit: number;
    netProfit: number;
    yoyGrowth: number;
  }>;

  @ApiProperty({ description: '연간 실적' })
  annualResults: Array<{
    year: string;
    revenue: number;
    operatingProfit: number;
    netProfit: number;
    yoyGrowth: number;
  }>;

  @ApiProperty({ description: '컨센서스 전망' })
  consensus: {
    targetPrice: number;
    recommendation: string;
    numberOfAnalysts: number;
    updatedAt: string;
  };
}

export class DividendInfoDto {
  @ApiProperty({ description: '배당금 (주당)' })
  dividendPerShare: number;

  @ApiProperty({ description: '배당수익률' })
  dividendYield: number;

  @ApiProperty({ description: '배당성향' })
  payoutRatio: number;

  @ApiProperty({ description: '배당 일정' })
  schedule: {
    exDividendDate?: string;
    recordDate?: string;
    paymentDate?: string;
  };

  @ApiProperty({ description: '과거 배당 이력' })
  history: Array<{
    year: string;
    dividendPerShare: number;
    dividendYield: number;
  }>;
}

export class PeerComparisonDto {
  @ApiProperty({ description: '동종업계 평균 지표' })
  industryAverages: {
    per: number;
    pbr: number;
    roe: number;
    dividendYield: number;
  };

  @ApiProperty({ description: '업종 내 순위' })
  ranking: {
    byMarketCap: number;
    byRevenue: number;
    byProfit: number;
    totalCompanies: number;
  };

  @ApiProperty({ description: '주요 경쟁사 비교' })
  competitors: Array<{
    name: string;
    stockCode: string;
    marketCap: number;
    per: number;
    pbr: number;
    roe: number;
  }>;
}

export class AnalystNewsDto {
  @ApiProperty({ description: '애널리스트 리포트' })
  analystReports: Array<{
    title: string;
    firm: string;
    analyst: string;
    date: string;
    targetPrice: number;
    recommendation: string;
    summary: string;
  }>;

  @ApiProperty({ description: '최근 뉴스' })
  news: Array<{
    title: string;
    source: string;
    date: string;
    url: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;

  @ApiProperty({ description: '뉴스 감성 분석' })
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    overallSentiment: string;
  };
}

export class FinancialStatementsDto {
  @ApiProperty({ description: '손익계산서' })
  incomeStatement: Array<{
    period: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
  }>;

  @ApiProperty({ description: '재무상태표' })
  balanceSheet: Array<{
    period: string;
    totalAssets: number;
    currentAssets: number;
    totalLiabilities: number;
    currentLiabilities: number;
    totalEquity: number;
  }>;

  @ApiProperty({ description: '현금흐름표' })
  cashFlow: Array<{
    period: string;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    freeCashFlow: number;
  }>;
}

export class RiskAnalysisDto {
  @ApiProperty({ description: '변동성 지표' })
  volatility: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
    beta: number;
  };

  @ApiProperty({ description: '재무 리스크' })
  financialRisk: {
    debtToEquity: number;
    interestCoverage: number;
    quickRatio: number;
    altmanZScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };

  @ApiProperty({ description: '주요 리스크 요인' })
  riskFactors: Array<{
    category: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
  }>;

  @ApiProperty({ description: 'AI 리스크 분석' })
  aiAnalysis: {
    summary: string;
    score: number;
    recommendations: string[];
  };
}

export class InvestmentAnalysisResponseDto {
  @ApiProperty({ description: '종목코드' })
  stockCode: string;

  @ApiProperty({ description: '분석일시' })
  analysisDate: string;

  @ApiProperty({ description: '1. 차트 데이터' })
  chartData: ChartDataDto;

  @ApiProperty({ description: '2. 회사 정보' })
  companyInfo: CompanyInfoDto;

  @ApiProperty({ description: '3. 투자 지표' })
  investmentMetrics: InvestmentMetricsDto;

  @ApiProperty({ description: '4. 실적/컨센서스' })
  performanceConsensus: PerformanceConsensusDto;

  @ApiProperty({ description: '5. 배당 정보' })
  dividendInfo: DividendInfoDto;

  @ApiProperty({ description: '6. 동종업계 비교' })
  peerComparison: PeerComparisonDto;

  @ApiProperty({ description: '7. 애널리스트/뉴스' })
  analystNews: AnalystNewsDto;

  @ApiProperty({ description: '8. 재무제표' })
  financialStatements: FinancialStatementsDto;

  @ApiProperty({ description: '9. 리스크/AI 분석' })
  riskAnalysis: RiskAnalysisDto;
}

export class GetInvestmentAnalysisDto {
  @ApiProperty({ description: '종목코드 (6자리)', example: '005930' })
  @IsString()
  stockCode: string;

  @ApiProperty({ 
    description: '차트 기간 (1d, 1w, 1m, 3m, 6m, 1y)', 
    default: '3m',
    required: false 
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiProperty({ 
    description: '포함할 섹션 (쉼표로 구분)',
    example: 'chart,company,metrics',
    required: false
  })
  @IsOptional()
  @IsString()
  sections?: string;
}