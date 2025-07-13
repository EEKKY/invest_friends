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
