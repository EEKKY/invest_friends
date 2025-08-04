import { IsString, IsOptional, Matches, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetChartRequestDto {
  @ApiProperty({
    description: '종목코드 (6자리, 예: 005930)',
    example: '005930',
  })
  @IsString()
  ticker: string;

  @ApiProperty({
    description: '기간 구분 (1d: 일봉, 1w: 주봉, 1m: 월봉, 1y: 년봉)',
    example: '1d',
    enum: ['1d', '1w', '1m', '1y'],
  })
  @IsString()
  @Matches(/^(1d|1w|1m|1y)$/)
  period: string;

  @ApiProperty({
    description: '조회 시작일 (YYYYMMDD)',
    example: '20240101',
  })
  @IsString()
  @Matches(/^\d{8}$/)
  startDate: string;

  @ApiProperty({
    description: '조회 종료일 (YYYYMMDD)',
    example: '20240727',
  })
  @IsString()
  @Matches(/^\d{8}$/)
  endDate: string;
}

export class ChartDataDto {
  @ApiProperty({ description: '날짜 (YYYYMMDD)', example: '20240727' })
  date: string;

  @ApiProperty({ description: '시가', example: 78900 })
  open: number;

  @ApiProperty({ description: '고가', example: 79500 })
  high: number;

  @ApiProperty({ description: '저가', example: 78100 })
  low: number;

  @ApiProperty({ description: '종가', example: 79000 })
  close: number;

  @ApiProperty({ description: '거래량', example: 15234567 })
  volume: number;
}

export class ChartResponseDto {
  @ApiProperty({ description: '종목코드', example: '005930' })
  ticker: string;

  @ApiProperty({ description: '기간', example: '1d' })
  period: string;

  @ApiProperty({ description: '시작일', example: '20240101' })
  startDate: string;

  @ApiProperty({ description: '종료일', example: '20240727' })
  endDate: string;

  @ApiProperty({ type: [ChartDataDto], description: '차트 데이터' })
  data: ChartDataDto[];
}

export class GetFinancialDataRequestDto {
  @ApiProperty({
    description: '기업코드 (DART 제공 8자리 코드)',
    example: '00126380',
  })
  @IsString()
  corpCode: string;

  @ApiProperty({
    description: '회계연도',
    example: 2023,
  })
  @Type(() => Number)
  @IsNumber()
  year: number;
}

export class FinancialDataResponseDto {
  @ApiProperty({ description: '기업코드', example: '00126380' })
  corpCode: string;

  @ApiProperty({ description: '회계연도', example: 2023 })
  year: number;

  @ApiProperty({ description: '매출액 (억원)', example: 2583372 })
  revenue: number;

  @ApiProperty({ description: '영업이익 (억원)', example: 63982 })
  operatingProfit: number;

  @ApiProperty({ description: '당기순이익 (억원)', example: 152790 })
  netIncome: number;

  @ApiProperty({ description: '총자산 (억원)', example: 4263310 })
  totalAssets: number;

  @ApiProperty({ description: '총자본 (억원)', example: 3282970 })
  totalEquity: number;

  @ApiProperty({ description: '주당순이익 (EPS, 원)', example: 22560 })
  eps: number;

  @ApiProperty({ description: '자기자본이익률 (ROE, %)', example: 4.65 })
  roe: number;

  @ApiProperty({ description: '총자산이익률 (ROA, %)', example: 3.58 })
  roa: number;
}
