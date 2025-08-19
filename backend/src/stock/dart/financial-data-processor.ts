/**
 * 재무 데이터 처리 유틸리티
 * DART API에서 받은 재무제표 데이터를 가공하여 필요한 형식으로 변환
 */

interface FinancialDataItem {
  account_nm: string;
  thstrm_amount: string;
  fs_div: string;
  sj_div: string;
}

interface ProcessedFinancialData {
  revenue: number; // 매출액 (억원)
  operatingProfit: number; // 영업이익 (억원)
  netIncome: number; // 당기순이익 (억원)
  totalAssets: number; // 총자산 (억원)
  totalEquity: number; // 총자본 (억원)
  eps?: number; // EPS (원) - 별도 계산 필요
}

/**
 * 문자열 금액을 억원 단위로 변환
 * @param amountStr - "123,456,789,000,000" 형식의 금액 문자열
 * @returns 억원 단위 숫자
 */
function convertToHundredMillion(amountStr: string): number {
  // 쉼표 제거하고 숫자로 변환
  const amount = parseFloat(amountStr.replace(/,/g, ''));
  // 원 단위를 억원 단위로 변환 (100,000,000으로 나누기)
  return Math.round(amount / 100000000);
}

/**
 * DART API 재무제표 데이터를 처리하여 필요한 형식으로 변환
 * @param data - DART API에서 받은 재무제표 데이터 배열
 * @returns 가공된 재무 데이터
 */
export function processFinancialData(
  data: FinancialDataItem[],
): ProcessedFinancialData {
  const result: ProcessedFinancialData = {
    revenue: 0,
    operatingProfit: 0,
    netIncome: 0,
    totalAssets: 0,
    totalEquity: 0,
  };

  // 연결재무제표(CFS) 우선, 없으면 개별재무제표(OFS) 사용
  const consolidatedData = data.filter((item) => item.fs_div === 'CFS');
  const dataToUse =
    consolidatedData.length > 0
      ? consolidatedData
      : data.filter((item) => item.fs_div === 'OFS');

  dataToUse.forEach((item) => {
    const amount = convertToHundredMillion(item.thstrm_amount);

    switch (item.account_nm) {
      case '매출액':
        if (item.sj_div === 'IS') {
          result.revenue = amount;
        }
        break;

      case '영업이익':
        if (item.sj_div === 'IS') {
          result.operatingProfit = amount;
        }
        break;

      case '당기순이익':
        if (item.sj_div === 'IS' && result.netIncome === 0) {
          result.netIncome = amount;
        }
        break;

      case '자산총계':
        if (item.sj_div === 'BS') {
          result.totalAssets = amount;
        }
        break;

      case '자본총계':
        if (item.sj_div === 'BS') {
          result.totalEquity = amount;
        }
        break;
    }
  });

  return result;
}

/**
 * EPS 계산 (별도 로직 필요)
 * @param netIncome - 당기순이익 (원 단위)
 * @param totalShares - 총 발행주식수
 * @returns EPS (원)
 */
export function calculateEPS(netIncome: number, totalShares: number): number {
  if (totalShares === 0) return 0;
  // 억원을 원 단위로 변환한 후 주식수로 나누기
  return Math.round((netIncome * 100000000) / totalShares);
}

/**
 * 실제 사용 예시
 */
export function extractFinancialMetrics(rawData: any): ProcessedFinancialData {
  // 제공된 데이터 구조 확인
  if (!rawData || !rawData.list || !Array.isArray(rawData.list)) {
    throw new Error('Invalid data structure');
  }

  // 데이터 처리
  const processed = processFinancialData(rawData.list);

  // 삼성전자 기준 예시 (실제로는 발행주식수를 API나 DB에서 가져와야 함)
  // 삼성전자 보통주 발행주식수: 약 5,969,782,550주 (2023년 기준)
  const SAMSUNG_TOTAL_SHARES = 5969782550;

  // EPS 계산 (당기순이익을 원 단위로 변환 후 계산)
  if (processed.netIncome > 0) {
    processed.eps = calculateEPS(processed.netIncome, SAMSUNG_TOTAL_SHARES);
  }

  return processed;
}

/**
 * 메인 처리 함수 - 실제 사용 예시
 */
export function formatFinancialData(apiResponse: any): any {
  try {
    const metrics = extractFinancialMetrics(apiResponse);

    console.log('처리된 재무 데이터:');
    console.log(`매출액: ${metrics.revenue.toLocaleString()}억원`);
    console.log(`영업이익: ${metrics.operatingProfit.toLocaleString()}억원`);
    console.log(`당기순이익: ${metrics.netIncome.toLocaleString()}억원`);
    console.log(`총자산: ${metrics.totalAssets.toLocaleString()}억원`);
    console.log(`총자본: ${metrics.totalEquity.toLocaleString()}억원`);
    console.log(`EPS: ${metrics.eps?.toLocaleString()}원`);

    // 변수 할당 형식으로 반환
    return {
      revenue: metrics.revenue, // 매출액 (억원)
      operatingProfit: metrics.operatingProfit, // 영업이익 (억원)
      netIncome: metrics.netIncome, // 당기순이익 (억원)
      totalAssets: metrics.totalAssets, // 총자산 (억원)
      totalEquity: metrics.totalEquity, // 총자본 (억원)
      eps: metrics.eps || 0, // EPS (원)
    };
  } catch (error) {
    console.error('재무 데이터 처리 중 오류 발생:', error);
    throw error;
  }
}
