import { Test, TestingModule } from '@nestjs/testing';
import { KisService } from './kis.service';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { of } from 'rxjs';

describe('KisService', () => {
  let service: KisService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KisService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KisService>(KisService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getPrice', () => {
    it('should return parsed price data', async () => {
      // Arrange: 모의 AccessToken 응답
      const mockTokenResponse: AxiosResponse = {
        data: {
          access_token: 'fake-token',
          expires_in: 3600,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as unknown as AxiosHeaders,
        },
      };

      // Arrange: 모의 시세 데이터 응답
      const mockPriceResponse: AxiosResponse = {
        data: {
          output: {
            stck_shrn_iscd: '005930',
            stck_prpr: '62600',
            prdy_vrss: '1600',
            prdy_ctrt: '2.62',
            per: '12.65',
            pbr: '1.08',
            rprs_mrkt_kor_name: 'KOSPI200',
          },
          rt_cd: '0',
          msg_cd: 'MCA00000',
          msg1: '정상처리 되었습니다.',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as unknown as AxiosHeaders },
      };

      // HttpService 모킹
      (httpService.post as jest.Mock).mockReturnValueOnce(
        of(mockTokenResponse),
      );
      (httpService.get as jest.Mock).mockReturnValueOnce(of(mockPriceResponse));

      // Act
      const result = await service.getPrice({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: '005930',
      });

      // Assert
      expect(result).toEqual({
        stck_shrn_iscd: '005930',
        stck_prpr: '62600',
        prdy_vrss: '1600',
        prdy_ctrt: '2.62',
        per: '12.65',
        pbr: '1.08',
        rprs_mrkt_kor_name: 'KOSPI200',
      });
    });
  });
});
