import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GetPriceRequestDto, PriceResponseDto } from './dto/get-price.dto';

@Injectable()
export class KisService {
  private readonly appKey = process.env.KIS_APP_KEY;
  private readonly appSecret = process.env.KIS_APP_SECRET;
  private accessToken: string | null = null;
  private accessTokenExpiresAt: Date | null = null;

  private readonly logger = new Logger(KisService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchAccessToken(): Promise<void> {
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://openapi.koreainvestment.com:9443/oauth2/tokenP',
        {
          grant_type: 'client_credentials',
          appkey: this.appKey,
          appsecret: this.appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    this.accessToken = data.access_token;
    const expiresIn = Number(data.expires_in); // 보통 초 단위로 제공
    this.accessTokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000 - 60 * 1000,
    ); // 만료 1분 전 갱신
    this.logger.log(`${this.accessToken}`);
    this.logger.log(
      `✅ KIS AccessToken 갱신 완료 (만료시각: ${this.accessTokenExpiresAt.toISOString()})`,
    );
  }

  private async getValidAccessToken(): Promise<string> {
    if (
      !this.accessToken ||
      !this.accessTokenExpiresAt ||
      new Date() >= this.accessTokenExpiresAt
    ) {
      await this.fetchAccessToken();
    }
    return this.accessToken!;
  }

  async getPrice(dto: GetPriceRequestDto): Promise<PriceResponseDto> {
    const { FID_COND_MRKT_DIV_CODE, FID_INPUT_ISCD } = dto;
    const token = await this.getValidAccessToken();
    const tr_id = 'FHKST01010100';

    const { data } = await firstValueFrom(
      this.httpService.get(
        'https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price',
        {
          headers: {
            authorization: `Bearer ${token}`,
            appkey: this.appKey,
            appsecret: this.appSecret,
            tr_id,
            custtype: 'P',
            'Content-Type': 'application/json; charset=utf-8',
          },
          params: {
            FID_COND_MRKT_DIV_CODE,
            FID_INPUT_ISCD,
          },
        },
      ),
    );

    const output = data.output;

    return {
      rprs_mrkt_kor_name: output.rprs_mrkt_kor_name,
      stck_shrn_iscd: output.stck_shrn_iscd,
      stck_prpr: output.stck_prpr,
      prdy_vrss: output.prdy_vrss,
      prdy_ctrt: output.prdy_ctrt,
      per: output.per,
      pbr: output.pbr,
    };
  }
}
