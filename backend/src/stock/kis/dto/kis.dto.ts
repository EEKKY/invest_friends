import { IsOptional, IsString, Length, Matches } from 'class-validator';
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

  @ApiProperty({ description: '상장 주수', example: '5969782550' })
  lstn_stcn?: string;

  @ApiProperty({ description: 'HTS 시가총액', example: '471000000000000' })
  hts_avls?: string;

  @ApiProperty({ description: '누적 거래량', example: '12345678' })
  acml_vol?: string;

  @ApiProperty({ description: '누적 거래 대금', example: '987654321000' })
  acml_tr_pbmn?: string;
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
    description: '기간 분류 코드(D, W, M)',
    example: 'D',
    minLength: 1,
    maxLength: 1,
  })
  @IsString()
  @Length(1, 1)
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
    description: '세금(원천징수) / 수수료 / 비과세 여부(Y, N)',
    example: 'N',
    enum: ['Y', 'N'],
  })
  @IsString()
  @Matches(/^(Y|N)$/)
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
export class KisTimeDailyChartResponseData {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: TimeChartItemDto[];
}

export class KisTimeDailyChartResponseDto {
  stock: KisTimeDailyChartResponseData;
  index: KisTimeDailyChartResponseData;
  status: number;
  msg: string;
}

export class KisTimeItemChartResponseData {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: TimeChartItemDto[];
}
export class KisTimeItemChartResponseDto {
  stock: KisTimeItemChartResponseData;
  index: KisTimeItemChartResponseData;
  status: Number;
  msg: String;
}
