/**
 * 재무 데이터 처리 테스트
 */
import { formatFinancialData } from './financial-data-processor';

// 제공된 실제 데이터
const sampleData = {
  status: '000',
  message: '정상',
  list: [
    {
      rcept_no: '20240312000736',
      reprt_code: '11011',
      bsns_year: '2023',
      corp_code: '00126380',
      stock_code: '005930',
      fs_div: 'CFS',
      fs_nm: '연결재무제표',
      sj_div: 'IS',
      sj_nm: '손익계산서',
      account_nm: '매출액',
      thstrm_nm: '제 55 기',
      thstrm_dt: '2023.01.01 ~ 2023.12.31',
      thstrm_amount: '258,935,494,000,000',
      frmtrm_nm: '제 54 기',
      frmtrm_dt: '2022.01.01 ~ 2022.12.31',
      frmtrm_amount: '302,231,360,000,000',
      bfefrmtrm_nm: '제 53 기',
      bfefrmtrm_dt: '2021.01.01 ~ 2021.12.31',
      bfefrmtrm_amount: '279,604,799,000,000',
      ord: '23',
      currency: 'KRW',
    },
    {
      rcept_no: '20240312000736',
      reprt_code: '11011',
      bsns_year: '2023',
      corp_code: '00126380',
      stock_code: '005930',
      fs_div: 'CFS',
      fs_nm: '연결재무제표',
      sj_div: 'IS',
      sj_nm: '손익계산서',
      account_nm: '영업이익',
      thstrm_nm: '제 55 기',
      thstrm_dt: '2023.01.01 ~ 2023.12.31',
      thstrm_amount: '6,566,976,000,000',
      frmtrm_nm: '제 54 기',
      frmtrm_dt: '2022.01.01 ~ 2022.12.31',
      frmtrm_amount: '43,376,630,000,000',
      bfefrmtrm_nm: '제 53 기',
      bfefrmtrm_dt: '2021.01.01 ~ 2021.12.31',
      bfefrmtrm_amount: '51,633,856,000,000',
      ord: '25',
      currency: 'KRW',
    },
    {
      rcept_no: '20240312000736',
      reprt_code: '11011',
      bsns_year: '2023',
      corp_code: '00126380',
      stock_code: '005930',
      fs_div: 'CFS',
      fs_nm: '연결재무제표',
      sj_div: 'IS',
      sj_nm: '손익계산서',
      account_nm: '당기순이익',
      thstrm_nm: '제 55 기',
      thstrm_dt: '2023.01.01 ~ 2023.12.31',
      thstrm_amount: '15,487,100,000,000',
      frmtrm_nm: '제 54 기',
      frmtrm_dt: '2022.01.01 ~ 2022.12.31',
      frmtrm_amount: '55,654,077,000,000',
      bfefrmtrm_nm: '제 53 기',
      bfefrmtrm_dt: '2021.01.01 ~ 2021.12.31',
      bfefrmtrm_amount: '39,907,450,000,000',
      ord: '29',
      currency: 'KRW',
    },
    {
      rcept_no: '20240312000736',
      reprt_code: '11011',
      bsns_year: '2023',
      corp_code: '00126380',
      stock_code: '005930',
      fs_div: 'CFS',
      fs_nm: '연결재무제표',
      sj_div: 'BS',
      sj_nm: '재무상태표',
      account_nm: '자산총계',
      thstrm_nm: '제 55 기',
      thstrm_dt: '2023.12.31 현재',
      thstrm_amount: '455,905,980,000,000',
      frmtrm_nm: '제 54 기',
      frmtrm_dt: '2022.12.31 현재',
      frmtrm_amount: '448,424,507,000,000',
      bfefrmtrm_nm: '제 53 기',
      bfefrmtrm_dt: '2021.12.31 현재',
      bfefrmtrm_amount: '426,621,158,000,000',
      ord: '5',
      currency: 'KRW',
    },
    {
      rcept_no: '20240312000736',
      reprt_code: '11011',
      bsns_year: '2023',
      corp_code: '00126380',
      stock_code: '005930',
      fs_div: 'CFS',
      fs_nm: '연결재무제표',
      sj_div: 'BS',
      sj_nm: '재무상태표',
      account_nm: '자본총계',
      thstrm_nm: '제 55 기',
      thstrm_dt: '2023.12.31 현재',
      thstrm_amount: '363,677,865,000,000',
      frmtrm_nm: '제 54 기',
      frmtrm_dt: '2022.12.31 현재',
      frmtrm_amount: '354,749,604,000,000',
      bfefrmtrm_nm: '제 53 기',
      bfefrmtrm_dt: '2021.12.31 현재',
      bfefrmtrm_amount: '304,899,931,000,000',
      ord: '21',
      currency: 'KRW',
    },
  ],
};

// 데이터 처리 실행
console.log('=== 재무 데이터 처리 테스트 ===\n');
const result = formatFinancialData(sampleData);

console.log('\n=== 처리 결과 ===');
console.log('const revenue =', result.revenue, '; // 매출액 (억원)');
console.log(
  'const operatingProfit =',
  result.operatingProfit,
  '; // 영업이익 (억원)',
);
console.log('const netIncome =', result.netIncome, '; // 당기순이익 (억원)');
console.log('const totalAssets =', result.totalAssets, '; // 총자산 (억원)');
console.log('const totalEquity =', result.totalEquity, '; // 총자본 (억원)');
console.log('const eps =', result.eps, '; // EPS (원)');

console.log('\n=== 예상값과 비교 ===');
console.log(
  '예상 매출액: 2,589,355억원 vs 실제:',
  result.revenue.toLocaleString() + '억원',
);
console.log(
  '예상 영업이익: 65,670억원 vs 실제:',
  result.operatingProfit.toLocaleString() + '억원',
);
console.log(
  '예상 당기순이익: 154,871억원 vs 실제:',
  result.netIncome.toLocaleString() + '억원',
);
console.log(
  '예상 총자산: 4,559,060억원 vs 실제:',
  result.totalAssets.toLocaleString() + '억원',
);
console.log(
  '예상 총자본: 3,636,779억원 vs 실제:',
  result.totalEquity.toLocaleString() + '억원',
);
