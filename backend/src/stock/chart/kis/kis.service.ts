import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import {
  KisChartRequestDto,
  GetPriceRequestDto,
  PriceResponseDto,
  KisChartResponseDto,
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
  KisTimeDailyChartResponseDto,
  KisTimeItemChartResponseDto,
  KisIndexChartRequestDto,
  KisIndexChartResponseDto,
} from './dto/kis.dto';

@Injectable()
export class KisService implements OnModuleInit {
  private readonly appKey = process.env.KIS_APP_KEY;
  private readonly appSecret = process.env.KIS_APP_SECRET;
  private accessToken: string | null = null;
  private accessTokenExpiresAt: Date | null = null;
  private indexCache = new Map<string, { data: any; timestamp: Date }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes during market hours

  private readonly KIS_API_BASE_URL =
    'https://openapi.koreainvestment.com:9443';
  private readonly TOKEN_ENDPOINT = '/oauth2/tokenP';
  private readonly INQUIRE_PRICE =
    '/uapi/domestic-stock/v1/quotations/inquire-price';
  private readonly INQUIRE_TIME_DAILY_CHART =
    '/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice';
  private readonly INQUIRE_TIME_ITEM_CHART =
    '/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice';
  private readonly INQUIRE_INDEX_CHART =
    '/uapi/domestic-stock/v1/quotations/inquire-index-daily-price';
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

      // Validate KIS API response
      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(`KIS Price API Error: ${data?.rt_cd} - ${errorMsg}`);
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      // Validate output data exists
      if (!data.output) {
        this.logger.error('KIS Price API returned no output data');
        throw new Error('No price data available');
      }

      const output = data.output;

      // Extract and validate required fields
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

  async getChartData(dto: KisChartRequestDto): Promise<KisChartResponseDto> {
    const {
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
      FID_INPUT_DATE_1,
      FID_INPUT_DATE_2,
      FID_PERIOD_DIV_CODE,
      FID_ORG_ADJ_PRC,
    } = dto;

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST03010100';
      const CHART_ENDPOINT =
        '/uapi/domestic-stock/v1/quotations/inquire-daily-price';

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.KIS_API_BASE_URL}${CHART_ENDPOINT}`, {
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
            FID_INPUT_DATE_1,
            FID_INPUT_DATE_2,
            FID_PERIOD_DIV_CODE,
            FID_ORG_ADJ_PRC,
          },
        }),
      );

      // Validate KIS API response
      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(`KIS Chart API Error: ${data?.rt_cd} - ${errorMsg}`);
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      // Validate output data exists
      if (!data.output2 || !Array.isArray(data.output2)) {
        this.logger.error('KIS Chart API returned no chart data');
        throw new Error('No chart data available');
      }

      // Return only necessary data
      return {
        rt_cd: data.rt_cd,
        msg_cd: data.msg_cd || '',
        msg1: data.msg1 || '',
        output2: data.output2.map((item: any) => ({
          stck_bsop_date: item.stck_bsop_date || '',
          stck_oprc: item.stck_oprc || '0',
          stck_hgpr: item.stck_hgpr || '0',
          stck_lwpr: item.stck_lwpr || '0',
          stck_clpr: item.stck_clpr || '0',
          acml_vol: item.acml_vol || '0',
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get chart data for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
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

      // Validate token response
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

  async getTimeDailyChart(
    dto: KisTimeDailyChartRequestDto,
  ): Promise<KisTimeDailyChartResponseDto> {
    const {
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
      FID_INPUT_DATE_1,
      FID_ORG_ADJ_PRC,
    } = dto;

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST03010200';

      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.KIS_API_BASE_URL}${this.INQUIRE_TIME_DAILY_CHART}`,
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
              FID_INPUT_DATE_1,
              FID_ORG_ADJ_PRC,
            },
          },
        ),
      );

      // Validate KIS API response
      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(
          `KIS Time Daily Chart API Error: ${data?.rt_cd} - ${errorMsg}`,
        );
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      // Validate output data exists
      if (!data.output2 || !Array.isArray(data.output2)) {
        this.logger.error('KIS Time Daily Chart API returned no data');
        throw new Error('No time daily chart data available');
      }

      // Return only necessary data
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
        `Failed to get time daily chart for ${FID_INPUT_ISCD}: ${error.message}`,
      );
      throw error;
    }
  }

  async getTimeItemChart(
    dto: KisTimeItemChartRequestDto,
  ): Promise<KisTimeItemChartResponseDto> {
    const {
      FID_COND_MRKT_DIV_CODE,
      FID_INPUT_ISCD,
      FID_INPUT_HOUR_1,
      FID_ORG_ADJ_PRC,
      FID_PW_DATA_INCU_YN,
    } = dto;

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHKST03010300';

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
              FID_INPUT_HOUR_1,
              FID_ORG_ADJ_PRC,
              FID_PW_DATA_INCU_YN,
            },
          },
        ),
      );

      // Validate KIS API response
      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(
          `KIS Time Item Chart API Error: ${data?.rt_cd} - ${errorMsg}`,
        );
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      // Validate output data exists
      if (!data.output2 || !Array.isArray(data.output2)) {
        this.logger.error('KIS Time Item Chart API returned no data');
        throw new Error('No time item chart data available');
      }

      // Return only necessary data
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

  async getIndexChart(
    dto: KisIndexChartRequestDto,
  ): Promise<KisIndexChartResponseDto> {
    const {
      FID_INPUT_ISCD,
      FID_INPUT_DATE_1,
      FID_INPUT_DATE_2,
      FID_PERIOD_DIV_CODE,
    } = dto;

    // Check if market is open and use appropriate caching strategy
    const isMarketOpen = this.isMarketOpen();
    const cacheKey = `${FID_INPUT_ISCD}_${FID_INPUT_DATE_1}_${FID_INPUT_DATE_2}_${FID_PERIOD_DIV_CODE}`;

    // For market closed, use longer cache duration (until next market open)
    const cacheData = this.indexCache.get(cacheKey);
    if (cacheData) {
      const age = Date.now() - cacheData.timestamp.getTime();
      const maxAge = isMarketOpen
        ? this.CACHE_DURATION
        : this.getTimeUntilMarketOpen();

      if (age < maxAge) {
        this.logger.log(
          `Using cached index data for ${FID_INPUT_ISCD} (market ${isMarketOpen ? 'open' : 'closed'})`,
        );
        return cacheData.data;
      }
    }

    try {
      const token = await this.getValidAccessToken();
      const tr_id = 'FHPUP02100000'; // 지수 일별 시세 조회

      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.KIS_API_BASE_URL}${this.INQUIRE_INDEX_CHART}`,
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
              fid_cond_mrkt_div_code: 'U',
              fid_input_iscd: FID_INPUT_ISCD,
              fid_input_date_1: FID_INPUT_DATE_1,
              fid_input_date_2: FID_INPUT_DATE_2,
              fid_period_div_code: FID_PERIOD_DIV_CODE,
            },
          },
        ),
      );

      // Validate KIS API response
      if (!data || data.rt_cd !== '0') {
        const errorMsg = data?.msg1 || 'Unknown KIS API error';
        this.logger.error(
          `KIS Index Chart API Error: ${data?.rt_cd} - ${errorMsg}`,
        );
        throw new Error(`KIS API Error: ${errorMsg}`);
      }

      // Validate output data exists
      if (!data.output2 || !Array.isArray(data.output2)) {
        this.logger.error('KIS Index Chart API returned no data');
        throw new Error('No index chart data available');
      }

      // Return only necessary data with proper sorting (oldest to newest)
      const result = {
        rt_cd: data.rt_cd,
        msg_cd: data.msg_cd || '',
        msg1: data.msg1 || '',
        output2: data.output2
          .map((item: any) => ({
            stck_bsop_date: item.stck_bsop_date || '',
            bsop_hour: item.bsop_hour || '',
            indx_prpr: item.indx_prpr || '0',
            indx_prdy_vrss: item.indx_prdy_vrss || '0',
            indx_prdy_ctrt: item.indx_prdy_ctrt || '0.00',
            acml_vol: item.acml_vol || '0',
            acml_tr_pbmn: item.acml_tr_pbmn || '0',
          }))
          .sort((a, b) => {
            // Sort by date (oldest to newest)
            const dateA = a.stck_bsop_date + (a.bsop_hour || '000000');
            const dateB = b.stck_bsop_date + (b.bsop_hour || '000000');
            return dateA.localeCompare(dateB);
          }),
      };

      // Log sample data for debugging
      this.logger.log(
        `Index chart data for ${FID_INPUT_ISCD}: ${result.output2.length} items, sample: ${JSON.stringify(
          result.output2.slice(0, 2),
        )}`,
      );

      // Cache the result
      this.indexCache.set(cacheKey, { data: result, timestamp: new Date() });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get index chart for ${FID_INPUT_ISCD}: ${error.message}`,
      );

      // Return mock data for testing
      const mockData = this.generateMockIndexData(
        FID_INPUT_ISCD,
        FID_INPUT_DATE_1,
        FID_INPUT_DATE_2,
      );

      this.logger.log(`Using mock index data for ${FID_INPUT_ISCD}`);

      return {
        rt_cd: '0',
        msg_cd: 'MOCK',
        msg1: 'Mock data for testing',
        output2: mockData,
      };
    }
  }

  private tokenRequestInProgress = false;
  private tokenRequestPromise: Promise<void> | null = null;

  private isMarketOpen(): boolean {
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );
    const hour = koreaTime.getHours();
    const minute = koreaTime.getMinutes();
    const day = koreaTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend check
    if (day === 0 || day === 6) {
      return false;
    }

    // Market hours: 9:00 - 15:30 KST
    const marketStart = 9 * 60; // 9:00 in minutes
    const marketEnd = 15 * 60 + 30; // 15:30 in minutes
    const currentTime = hour * 60 + minute;

    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  private getTimeUntilMarketOpen(): number {
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );
    const nextMarketOpen = new Date(koreaTime);

    // If it's weekend, set to next Monday 9:00
    if (koreaTime.getDay() === 0) {
      // Sunday
      nextMarketOpen.setDate(koreaTime.getDate() + 1); // Monday
    } else if (koreaTime.getDay() === 6) {
      // Saturday
      nextMarketOpen.setDate(koreaTime.getDate() + 2); // Monday
    } else if (koreaTime.getHours() >= 15 && koreaTime.getMinutes() > 30) {
      // After market close, set to next day
      nextMarketOpen.setDate(koreaTime.getDate() + 1);
    }

    nextMarketOpen.setHours(9, 0, 0, 0);

    return nextMarketOpen.getTime() - koreaTime.getTime();
  }

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

  private generateMockIndexData(
    indexCode: string,
    startDate: string,
    endDate: string,
  ) {
    const baseIndex = indexCode === '0001' ? 2500 : 850; // KOSPI: 2500, KOSDAQ: 850
    const start = new Date(
      parseInt(startDate.slice(0, 4)),
      parseInt(startDate.slice(4, 6)) - 1,
      parseInt(startDate.slice(6, 8)),
    );
    const end = new Date(
      parseInt(endDate.slice(0, 4)),
      parseInt(endDate.slice(4, 6)) - 1,
      parseInt(endDate.slice(6, 8)),
    );

    const data = [];
    let currentIndex = baseIndex;
    const current = new Date(start);

    let previousIndex = currentIndex;

    while (current <= end) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        // Generate realistic index movement
        const change = (Math.random() - 0.5) * 0.02; // ±1% daily change
        const newIndex = currentIndex * (1 + change);
        const priceChange = newIndex - previousIndex;
        const changeRate =
          previousIndex > 0 ? (priceChange / previousIndex) * 100 : 0;

        data.push({
          stck_bsop_date: current.toISOString().slice(0, 10).replace(/-/g, ''),
          bsop_hour: '',
          indx_prpr: newIndex.toFixed(2), // 문자열로 저장
          indx_prdy_vrss: priceChange.toFixed(2),
          indx_prdy_ctrt: changeRate.toFixed(2),
          acml_vol: Math.floor(Math.random() * 10000000000).toString(),
          acml_tr_pbmn: Math.floor(Math.random() * 100000000).toString(),
        });

        previousIndex = newIndex;
        currentIndex = newIndex;
      }
      current.setDate(current.getDate() + 1);
    }

    return data;
  }
}
