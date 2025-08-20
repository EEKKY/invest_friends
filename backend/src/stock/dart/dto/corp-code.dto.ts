export class CorpCodeDto {
  corp_code: string; // 고유번호 (8자리 문자열)
  corp_name: string; // 한글 회사명
  corp_eng_name: string; // 영문 회사명
  stock_code: string; // 종목코드 (6자리 문자열, 상장기업만 있음)
  modify_date: number; // YYYYMMDD 형식 (숫자)
}
