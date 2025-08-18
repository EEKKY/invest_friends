import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import {
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
  KisTimeDailyChartResponseDto,
  KisTimeItemChartResponseDto,
  PriceResponseDto,
  GetPriceRequestDto,
} from './dto/kis.dto';

@Injectable()
export class KisService implements OnModuleInit {
  private readonly appKey = process.env.KIS_APP_KEY;
  private readonly appSecret = process.env.KIS_APP_SECRET;
  private accessToken: string | null = null;
  private accessTokenExpiresAt: Date | null = null;

  private readonly KIS_API_BASE_URL =
    'https://openapi.koreainvestment.com:9443';
  private readonly TOKEN_ENDPOINT = '/oauth2/tokenP';
  private readonly INQUIRE_PRICE =
    '/uapi/domestic-stock/v1/quotations/inquire-price';
  private readonly INQUIRE_DAILY_PRICE =
    '/uapi/domestic-stock/v1/quotations/inquire-daily-price';
  private readonly INQUIRE_INDEX_DAILY_PRICE =
    '/uapi/domestic-stock/v1/quotations/inquire-index-daily-price';
  private readonly INQUIRE_TIME_ITEM_CHART =
    '/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice';
  private readonly logger = new Logger(KisService.name);

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    // 서버 시작 시 토큰을 미리 발급받음
    try {
      await this.fetchAccessToken();
      this.logger.log('KIS access token initialized on startup');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize KIS token on startup:',
        error.message,
      );
    }
  }

  async fetchAccessToken(): Promise<void> {
    try {
      // Check if credentials are properly configured
      if (!this.appKey || !this.appSecret) {
        throw new Error(
          'KIS API credentials are not configured. Please check KIS_APP_KEY and KIS_APP_SECRET in .env file',
        );
      }

      // Remove any quotes or escape characters from credentials
      const cleanAppKey = this.appKey.replace(/['"]/g, '');
      const cleanAppSecret = this.appSecret.replace(/['"\\]/g, '');

      const { data } = await firstValueFrom(
        this.httpService
          .post(
            `${this.KIS_API_BASE_URL}${this.TOKEN_ENDPOINT}`,
            {
              grant_type: 'client_credentials',
              appkey: cleanAppKey,
              appsecret: cleanAppSecret,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(
            catchError((error) => {
              if (error.response) {
                const errorMsg =
                  error.response.data?.error_description ||
                  error.response.statusText;
                const errorCode =
                  error.response.data?.error_code || error.response.status;
                this.logger.error(
                  `KIS Token API Error [${errorCode}]: ${errorMsg}`,
                );

                if (error.response.status === 403) {
                  throw new Error(
                    `KIS API Authentication Failed: ${errorMsg}. Please check your KIS_APP_KEY and KIS_APP_SECRET in .env file`,
                  );
                }
              }
              throw error;
            }),
          ),
      );

      if (!data || !data.access_token) {
        const errorMsg =
          data?.error_description || 'Failed to get access token';
        this.logger.error(`KIS Token API Error: ${errorMsg}`);
        throw new Error(`Token Error: ${errorMsg}`);
      }

      this.accessToken = data.access_token;
      const expiresIn = Number(data.expires_in) || 86400; // Default 24 hours if not provided
      this.accessTokenExpiresAt = new Date(
        Date.now() + expiresIn * 1000 - 5 * 60 * 1000,
      ); // 만료 5분 전 갱신으로 변경

      this.logger.log(
        `KIS AccessToken 갱신 완료 (만료시각: ${this.accessTokenExpiresAt.toISOString()})`,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch KIS access token: ${error.message}`);
      throw error;
    }
  }

  async getPrice(dto: GetPriceRequestDto): Promise<PriceResponseDto> {
    const { FID_COND_MRKT_DIV_CODE, FID_INPUT_ISCD } = dto;

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST01010100';

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.KIS_API_BASE_URL}${this.INQUIRE_PRICE}`, {
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
        }),
      );

      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(`KIS Price API Error: ${data?.rt_cd} - ${errorMsg}`);
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      if (!data.output) {
        this.logger.error('KIS Price API returned no output data');
        throw new Error('No price data available');
      }

      const output = data.output;

      return {
        rprs_mrkt_kor_name: output.rprs_mrkt_kor_name || '',
        stck_shrn_iscd: output.stck_shrn_iscd || FID_INPUT_ISCD,
        stck_prpr: output.stck_prpr || '0',
        prdy_vrss: output.prdy_vrss || '0',
        prdy_ctrt: output.prdy_ctrt || '0.00',
        per: output.per || '0.00',
        pbr: output.pbr || '0.00',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get price for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
    }
  }

  async getTimeDailyChart(
    dto: KisTimeDailyChartRequestDto,
  ): Promise<KisTimeDailyChartResponseDto> {
    const {
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
      FID_PERIOD_DIV_CODE,
      FID_ORG_ADJ_PRC,
    } = dto;

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST01010400';
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.KIS_API_BASE_URL}${this.INQUIRE_DAILY_PRICE}`,
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
              FID_PERIOD_DIV_CODE,
              FID_ORG_ADJ_PRC,
            },
          },
        ),
      );

      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(
          `KIS Index Chart API Error: ${data?.rt_cd} - ${errorMsg}`,
        );
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      return {
        rt_cd: data.rt_cd,
        msg_cd: data.msg_cd || '',
        msg1: data.msg1 || '',
        output: data.output.map((item: any) => ({
          stck_cntg_hour: item.stck_cntg_hour || '',
          stck_oprc: item.stck_oprc || '0',
          stck_hgpr: item.stck_hgpr || '0',
          stck_lwpr: item.stck_lwpr || '0',
          stck_prpr: item.stck_prpr || '0',
          cntg_vol: item.cntg_vol || '0',
          acml_vol: item.acml_vol || '0',
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get time daily chart for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
    }
  }

  async getTimeItemChart(
    dto: KisTimeItemChartRequestDto,
  ): Promise<KisTimeItemChartResponseDto> {
    const { FID_COND_MRKT_DIV_CODE, FID_INPUT_ISCD, FID_PW_DATA_INCU_YN } = dto;

    try {
      const now = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST03010200';
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.KIS_API_BASE_URL}${this.INQUIRE_TIME_ITEM_CHART}`,
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
              FID_INPUT_HOUR_1: now,
              FID_ETC_CLS_CODE: '',
              FID_PW_DATA_INCU_YN,
            },
          },
        ),
      );

      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(`KIS Chart API Error: ${data?.rt_cd} - ${errorMsg}`);
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      return {
        rt_cd: data.rt_cd,
        msg_cd: data.msg_cd || '',
        msg1: data.msg1 || '',
        output2: data.output2.map((item: any) => ({
          stck_cntg_hour: item.stck_cntg_hour || '',
          stck_oprc: item.stck_oprc || '0',
          stck_hgpr: item.stck_hgpr || '0',
          stck_lwpr: item.stck_lwpr || '0',
          stck_prpr: item.stck_prpr || '0',
          cntg_vol: item.cntg_vol || '0',
          acml_vol: item.acml_vol || '0',
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get time item chart for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDailyIndexChart(data): Promise<KisTimeDailyChartResponseDto> {
    const { FID_INPUT_ISCD, FID_PERIOD_DIV_CODE } = data;
    const now = new Date();
    const FID_INPUT_DATE_1 =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHPUP02120000';
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.KIS_API_BASE_URL}${this.INQUIRE_INDEX_DAILY_PRICE}`,
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
              FID_COND_MRKT_DIV_CODE: 'U',
              FID_INPUT_ISCD,
              FID_PERIOD_DIV_CODE,
              FID_INPUT_DATE_1,
            },
          },
        ),
      );

      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(
          `KIS Index Chart API Error: ${data?.rt_cd} - ${errorMsg}`,
        );
        throw new Error(`KIS API Error: ${errorMsg}`);
      }
      return {
        rt_cd: data.rt_cd,
        msg_cd: data.msg_cd || '',
        msg1: data.msg1 || '',
        output: data.output2.map((item: any) => ({
          stck_cntg_hour: item.stck_cntg_hour || '',
          stck_oprc: item.bstp_nmix_oprc || '0',
          stck_hgpr: item.bstp_nmix_hgpr || '0',
          stck_lwpr: item.bstp_nmix_lwpr || '0',
          stck_prpr: item.bstp_nmix_prpr || '0',
          cntg_vol: item.cntg_vol || '0',
          acml_vol: item.acml_vol || '0',
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get time daily chart for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDailyChart(
    dto: KisTimeDailyChartRequestDto,
  ): Promise<KisTimeDailyChartResponseDto[]> {
    const { FID_COND_MRKT_DIV_CODE, FID_INPUT_ISCD } = dto;
    // KOSPI KOSDAQ
    if (FID_INPUT_ISCD === '0001' || FID_INPUT_ISCD === '1001')
      return [await this.getTimeDailyChart(dto)];

    const price = await this.getPrice({
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
    });

    if (price.rprs_mrkt_kor_name.slice(0, 5) === 'KOSPI') {
      const dailyChart = await this.getTimeDailyChart(dto);
      const indexDto = {
        ...dto,
        FID_INPUT_ISCD: '0001',
        FID_COND_MRKT_DIV_CODE: 'U',
      };
      const indexChart = await this.getDailyIndexChart(indexDto);
      return [dailyChart, indexChart];
    } else {
      const dailyChart = await this.getTimeDailyChart(dto);
      const indexDto = {
        ...dto,
        FID_INPUT_ISCD: '1001',
        FID_COND_MRKT_DIV_CODE: 'U',
      };
      const indexChart = await this.getDailyIndexChart(indexDto);
      return [dailyChart, indexChart];
    }
  }

  async getItemChart(
    dto: KisTimeItemChartRequestDto,
  ): Promise<KisTimeItemChartResponseDto[]> {
    const { FID_COND_MRKT_DIV_CODE, FID_INPUT_ISCD } = dto;
    // KOSPI KOSDAQ
    if (FID_INPUT_ISCD === '0001' || FID_INPUT_ISCD === '1001')
      return [await this.getTimeItemChart(dto)];
    const price = await this.getPrice({
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
    });

    if (price.rprs_mrkt_kor_name.slice(0, 5) === 'KOSPI') {
      const dailyChart = await this.getTimeItemChart(dto);
      const indexDto = {
        ...dto,
        FID_INPUT_ISCD: '0001',
      };
      const indexChart = await this.getTimeItemChart(indexDto);
      return [dailyChart, indexChart];
    } else {
      const dailyChart = await this.getTimeItemChart(dto);
      const indexDto = {
        ...dto,
        FID_INPUT_ISCD: '1001',
      };
      const indexChart = await this.getTimeItemChart(dto);
      return [dailyChart, indexChart];
    }
  }

  private tokenRequestInProgress = false;
  private tokenRequestPromise: Promise<void> | null = null;

  private async getValidAccessToken(): Promise<string> {
    try {
      // 토큰이 유효하면 바로 반환
      if (
        this.accessToken &&
        this.accessTokenExpiresAt &&
        new Date() < this.accessTokenExpiresAt
      ) {
        return this.accessToken;
      }

      // 이미 토큰 요청이 진행 중이면 대기
      if (this.tokenRequestInProgress && this.tokenRequestPromise) {
        await this.tokenRequestPromise;
        if (this.accessToken) {
          return this.accessToken;
        }
      }

      // 새로운 토큰 요청
      this.tokenRequestInProgress = true;
      this.tokenRequestPromise = this.fetchAccessToken();

      try {
        await this.tokenRequestPromise;
        return this.accessToken!;
      } finally {
        this.tokenRequestInProgress = false;
        this.tokenRequestPromise = null;
      }
    } catch (error) {
      this.logger.error('Failed to get valid access token', error);

      // 토큰 발급 제한 오류인 경우 기존 토큰이 있으면 사용
      if (
        error.message &&
        error.message.includes('1분당 1회') &&
        this.accessToken
      ) {
        this.logger.warn('Using existing token due to rate limit');
        return this.accessToken;
      }

      // 기존 토큰이 있으면 일단 사용 (만료되었더라도)
      if (this.accessToken) {
        this.logger.warn('Using existing token despite error');
        return this.accessToken;
      }

      throw new Error(
        'Unable to authenticate with KIS API. Please check your credentials.',
      );
    }
  }
}
