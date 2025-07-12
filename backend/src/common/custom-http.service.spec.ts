import { CustomHttpService } from './custom-http.service';
import { HttpService } from '@nestjs/axios';
import { AxiosFilterService } from './axios/axios-filter.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('CustomHttpService', () => {
  let service: CustomHttpService;
  let httpService: HttpService;
  let axiosFilterService: AxiosFilterService;

  const getMock = jest.fn();
  const interceptorsUseMock = jest.fn();
  const axiosRefMock = {
    get: getMock,
    interceptors: {
      response: {
        use: interceptorsUseMock,
      },
    },
  };

  const handleMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: axiosRefMock,
          },
        },
        {
          provide: AxiosFilterService,
          useValue: {
            handle: handleMock,
          },
        },
      ],
    }).compile();

    service = module.get<CustomHttpService>(CustomHttpService);
    httpService = module.get<HttpService>(HttpService);
    axiosFilterService = module.get<AxiosFilterService>(AxiosFilterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call axiosRef.get and return data', async () => {
    const mockData = { data: 'mock data' };
    getMock.mockResolvedValueOnce(mockData);

    const result = await service.get('https://test.com/test');

    expect(result).toEqual(mockData);
    expect(getMock).toHaveBeenCalledWith('https://test.com/test');
  });

  it('should call AxiosFilterService.handle on error', async () => {
    const error = new Error('[DEFAULT] 에러 발생: /failing-url');
    const handleMock = jest.fn();

    // interceptor 등록 시, reject 핸들러에 접근 가능하도록 저장
    let rejectInterceptor: (err: any) => any = () => {};

    const module = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn().mockRejectedValue(error), // axios 호출은 여전히 실패
              interceptors: {
                response: {
                  use: (resolve: any, reject: any) => {
                    rejectInterceptor = reject; // 여기서 reject 핸들러 저장
                  },
                },
              },
            },
          },
        },
        {
          provide: AxiosFilterService,
          useValue: {
            handle: handleMock,
          },
        },
      ],
    }).compile();

    const service = module.get<CustomHttpService>(CustomHttpService);

    // interceptor 등록 직후 직접 호출
    rejectInterceptor(error);

    // 에러 핸들러 호출 검증
    expect(handleMock).toHaveBeenCalledWith(error);
  });
});
