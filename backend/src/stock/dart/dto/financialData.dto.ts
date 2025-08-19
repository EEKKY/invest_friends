import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Length, Matches } from 'class-validator';
export class FinancialDataRequestDto {
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
