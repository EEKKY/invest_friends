import { ApiProperty } from '@nestjs/swagger';

export class RecommendedStockDto {
  @ApiProperty({ example: '005930', description: '종목 코드' })
  code: string;

  @ApiProperty({ example: '삼성전자', description: '종목명' })
  name: string;

  @ApiProperty({
    example: '우수한 재무구조와 안정적인 수익성, 최근 상승 모멘텀',
    description: '추천 이유',
  })
  reason: string;

  @ApiProperty({ example: 78900, description: '현재가' })
  currentPrice: number;

  @ApiProperty({ example: 86790, description: '목표가' })
  targetPrice: number;

  @ApiProperty({ example: 10, description: '예상 수익률 (%)' })
  expectedReturn: number;

  @ApiProperty({
    enum: ['low', 'medium', 'high'],
    example: 'medium',
    description: '위험 수준',
  })
  riskLevel: 'low' | 'medium' | 'high';
}

export class SectorRecommendationResponseDto {
  @ApiProperty({ example: '반도체', description: '섹터명' })
  sector: string;

  @ApiProperty({
    type: [RecommendedStockDto],
    description: '추천 종목 목록',
  })
  stocks: RecommendedStockDto[];

  @ApiProperty({
    example:
      'AI와 데이터센터 수요 증가로 메모리 반도체 시장 회복이 예상됩니다. 다만 중국 수요와 재고 조정 상황을 모니터링 필요합니다.',
    description: '섹터 분석',
  })
  sectorAnalysis: string;

  @ApiProperty({
    example: '바닥 통과 후 회복 국면 진입. AI 반도체 수혜주 중심 투자 유효',
    description: '시장 트렌드',
  })
  marketTrend: string;
}

export class AvailableSectorsResponseDto {
  @ApiProperty({
    type: [String],
    example: ['2차전지', '반도체', 'AI/클라우드', '바이오', '방산'],
    description: '사용 가능한 섹터 목록',
  })
  sectors: string[];
}