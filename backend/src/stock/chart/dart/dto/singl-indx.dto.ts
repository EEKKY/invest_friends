import { IsString, Length, Matches } from 'class-validator';

export class SinglIndxRequest {
  @IsString()
  @Length(40, 40)
  crtfc_key: string;

  @IsString()
  @Length(8, 8)
  corp_code: string;

  @IsString()
  @Length(4, 4)
  bsns_year: string;

  @IsString()
  @Matches(/^(11011|11012|11013|11014)$/)
  reprt_code: string;

  @IsString()
  @Matches(/^(M210000|M220000|M230000|M240000)$/)
  idx_cl_code: string;
}

export class SinglIndxItem {
  reprt_code: string;
  bsns_year: string;
  corp_code: string;
  stock_code: string;
  stlm_dt: string;
  idx_cl_code: string;
  idx_cl_nm: string;
  idx_code: string;
  idx_nm: string;
  idx_val: string;
}

export class SinglIndxResponse {
  status: string;
  message: string;
  list: SinglIndxItem[];
}
