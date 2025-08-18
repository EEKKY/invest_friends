/**
 * 가공된 재무 데이터 DTO
 */
export class FormattedFinancialDto {
  revenue: number; // 매출액 (억원)
  operatingProfit: number; // 영업이익 (억원)
  netIncome: number; // 당기순이익 (억원)
  totalAssets: number; // 총자산 (억원)
  totalEquity: number; // 총자본 (억원)
  eps: number; // EPS (원)

  // 추가 정보
  year?: number; // 회계연도
  corpName?: string; // 회사명
  stockCode?: string; // 종목코드
}
