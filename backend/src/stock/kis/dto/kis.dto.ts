import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPriceRequestDto {
  @ApiProperty({
    description: '시장 코드 (J: KRX, NX: K-OTC, UN: 통합)',
    example: 'J',
  })
  @IsString()
  @Matches(/^(J|NX|UN)$/)
  FID_COND_MRKT_DIV_CODE: string;

  @ApiProperty({
    description: '종목코드 (예: 005930)',
    example: '005930',
  })
  @IsString()
  @Length(6, 12)
  FID_INPUT_ISCD: string;
}

export class PriceResponseDto {
  @ApiProperty({ description: '종목명', example: '삼성전자' })
  rprs_mrkt_kor_name: string;

  @ApiProperty({ description: '종목코드', example: '005930' })
  stck_shrn_iscd: string;

  @ApiProperty({ description: '현재가', example: '78900' })
  stck_prpr: string;

  @ApiProperty({ description: '전일 대비 가격', example: '1100' })
  prdy_vrss: string;

  @ApiProperty({ description: '전일 대비 등락률 (%)', example: '1.41' })
  prdy_ctrt: string;

  @ApiProperty({ description: 'PER', example: '13.12' })
  per: string;

  @ApiProperty({ description: 'PBR', example: '1.25' })
  pbr: string;
}

export class KisChartRequestDto {
  @ApiProperty({
    description: '시장 코드 (J: KRX, NX: K-OTC, UN: 통합)',
    example: 'J',
    enum: ['J', 'NX', 'UN'],
  })
  @IsString()
  @Matches(/^(J|NX|UN)$/)
  FID_COND_MRKT_DIV_CODE: string;

  @ApiProperty({
    description: '종목코드 (6~12자리, 예: 005930)',
    example: '005930',
    minLength: 6,
    maxLength: 12,
  })
  @IsString()
  @Length(6, 12)
  FID_INPUT_ISCD: string;

  @ApiProperty({
    description: '조회 시작일자 (YYYYMMDD)',
    example: '20240101',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8)
  FID_INPUT_DATE_1: string;

  @ApiProperty({
    description: '조회 종료일자 (YYYYMMDD, 최대 100개)',
    example: '20240727',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8)
  FID_INPUT_DATE_2: string;

  @ApiProperty({
    description: '기간분류코드 (D:일봉, W:주봉, M:월봉, Y:년봉)',
    example: 'D',
    enum: ['D', 'W', 'M', 'Y'],
  })
  @IsString()
  @Matches(/^(D|W|M|Y)$/)
  FID_PERIOD_DIV_CODE: string;

  @ApiProperty({
    description: '수정주가/원주가 구분 (0:수정주가, 1:원주가)',
    example: '0',
    enum: ['0', '1'],
  })
  @IsString()
  @Matches(/^(0|1)$/)
  FID_ORG_ADJ_PRC: string;
}

export class ChartItemDto {
  stck_bsop_date: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  stck_clpr: string;
  acml_vol: string;
}

export class KisChartResponseDto {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output2: ChartItemDto[];
}

export class KisTimeDailyChartRequestDto {
  @ApiProperty({
    description: '시장 코드 (J: KRX, NX: K-OTC, UN: 통합)',
    example: 'J',
    enum: ['J', 'NX', 'UN'],
  })
  @IsString()
  @Matches(/^(J|NX|UN)$/)
  FID_COND_MRKT_DIV_CODE: string;

  @ApiProperty({
    description: '종목코드 (6~12자리, 예: 005930)',
    example: '005930',
    minLength: 6,
    maxLength: 12,
  })
  @IsString()
  @Length(6, 12)
  FID_INPUT_ISCD: string;

  @ApiProperty({
    description: '조회 일자 (YYYYMMDD)',
    example: '20240727',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8)
  FID_INPUT_DATE_1: string;

  @ApiProperty({
    description: '수정주가/원주가 구분 (0:수정주가, 1:원주가)',
    example: '0',
    enum: ['0', '1'],
  })
  @IsString()
  @Matches(/^(0|1)$/)
  FID_ORG_ADJ_PRC: string;
}

export class KisTimeItemChartRequestDto {
  @ApiProperty({
    description: '시장 코드 (J: KRX, NX: K-OTC, UN: 통합)',
    example: 'J',
    enum: ['J', 'NX', 'UN'],
  })
  @IsString()
  @Matches(/^(J|NX|UN)$/)
  FID_COND_MRKT_DIV_CODE: string;

  @ApiProperty({
    description: '종목코드 (6~12자리, 예: 005930)',
    example: '005930',
    minLength: 6,
    maxLength: 12,
  })
  @IsString()
  @Length(6, 12)
  FID_INPUT_ISCD: string;

  @ApiProperty({
    description: '조회 시작시간 (HHMMSS)',
    example: '090000',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  FID_INPUT_HOUR_1: string;

  @ApiProperty({
    description: '수정주가/원주가 구분 (0:수정주가, 1:원주가)',
    example: '0',
    enum: ['0', '1'],
  })
  @IsString()
  @Matches(/^(0|1)$/)
  FID_ORG_ADJ_PRC: string;

  @ApiProperty({
    description:
      '분봉주기 (1:1분, 3:3분, 5:5분, 10:10분, 15:15분, 30:30분, 60:60분)',
    example: '1',
    enum: ['1', '3', '5', '10', '15', '30', '60'],
  })
  @IsString()
  @Matches(/^(1|3|5|10|15|30|60)$/)
  FID_PW_DATA_INCU_YN: string;
}

export class TimeChartItemDto {
  stck_cntg_hour: string; // 시간
  stck_oprc: string; // 시가
  stck_hgpr: string; // 고가
  stck_lwpr: string; // 저가
  stck_prpr: string; // 현재가 (종가)
  cntg_vol: string; // 거래량
  acml_vol: string; // 누적거래량
}

export class KisTimeDailyChartResponseDto {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output2: TimeChartItemDto[];
}

export class KisTimeItemChartResponseDto {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output2: TimeChartItemDto[];
}

export class KisIndexChartRequestDto {
  @ApiProperty({
    description: '지수 코드 (0001: 코스피, 1001: 코스닥)',
    example: '0001',
    enum: ['0001', '1001'],
  })
  @IsString()
  @Matches(/^(0001|1001)$/)
  FID_INPUT_ISCD: string;

  @ApiProperty({
    description: '조회 시작일자 (YYYYMMDD)',
    example: '20240101',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8)
  FID_INPUT_DATE_1: string;

  @ApiProperty({
    description: '조회 종료일자 (YYYYMMDD)',
    example: '20240727',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8)
  FID_INPUT_DATE_2: string;

  @ApiProperty({
    description: '기간분류코드 (D:일봉, W:주봉, M:월봉)',
    example: 'D',
    enum: ['D', 'W', 'M'],
  })
  @IsString()
  @Matches(/^(D|W|M)$/)
  FID_PERIOD_DIV_CODE: string;
}

export class IndexChartItemDto {
  stck_bsop_date: string; // 날짜
  bsop_hour: string; // 시간
  indx_prpr: string; // 지수
  indx_prdy_vrss: string; // 전일대비
  indx_prdy_ctrt: string; // 전일대비율
  acml_vol: string; // 누적거래량
  acml_tr_pbmn: string; // 누적거래대금
}

export class KisIndexChartResponseDto {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output2: IndexChartItemDto[];
}
