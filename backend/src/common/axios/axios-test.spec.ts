import { Test, TestingModule } from '@nestjs/testing';
import { AxiosFilterService } from './error_handler/axios-filter.service';
import { AbstractHttpExecutor } from './axios-abstract';
import { AxiosInstance, AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ApiError, ApiResponse } from './axios.dto';

class MockHttpService {
  axiosRef: AxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  } as unknown as AxiosInstance;
}

// 제네릭 명시적으로 지정
class TestExecutor extends AbstractHttpExecutor<string, ApiError> {
  protected async get(url: string): Promise<ApiResponse<string>> {
    return { data: `GET:${url}`, statusCode: 200 };
  }

  protected async post(
    url: string,
    data: string,
  ): Promise<ApiResponse<string>> {
    return { data: `POST:${url}:${data}`, statusCode: 201 };
  }

  protected async handleError(error: unknown): Promise<ApiError> {
    return {
      data: 'error',
      message: (error as Error).message,
      statusCode: 500,
    };
  }

  protected after(res: ApiResponse<string>): string {
    return res.data;
  }
}

describe('AxiosFilterService', () => {
  let service: AxiosFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AxiosFilterService],
    }).compile();

    service = module.get<AxiosFilterService>(AxiosFilterService);
  });

  it('should attach interceptor only once', () => {
    const instance = {
      interceptors: { response: { use: jest.fn() } },
    } as unknown as AxiosInstance;
    service.attach(instance);
    service.attach(instance);
    expect(instance.interceptors.response.use).toBeCalledTimes(1);
  });

  it('should handle error with matched strategy', () => {
    const error = {
      config: { url: 'https://test.com/unknown' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.message).toMatch(/Test API Error*/);
  });

  it('should handle test.com strategy', () => {
    const error = {
      config: { url: 'https://test.com/endpoint' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('Test Api Not Found');
    expect(handled.message).toBe('Test API Error https://test.com/endpoint');
    expect(handled.statusCode).toBe(404);
  });

  it('should handle asset.com strategy', () => {
    const error = {
      config: { url: 'https://asset.com/resource' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('Asset Api Not Found');
    expect(handled.message).toBe('Asset API Error https://asset.com/resource');
    expect(handled.statusCode).toBe(404);
  });

  it('should fallback to default strategy for unmatched url', () => {
    const error = {
      config: { url: 'https://unknown.com/something' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('No matched api');
    expect(handled.message).toMatch(
      /Unhandled error at https:\/\/unknown\.com\/something/,
    );
    expect(handled.statusCode).toBe(500);
  });
});

describe('AbstractHttpExecutor', () => {
  let executor: TestExecutor;
  let mockHttpService: MockHttpService;
  let axiosFilterService: AxiosFilterService;

  beforeEach(() => {
    mockHttpService = new MockHttpService();
    axiosFilterService = new AxiosFilterService();
    executor = new TestExecutor({
      httpService: mockHttpService as HttpService,
      axiosFilterService,
    });
  });

  it('should call GET and return after-processed data', async () => {
    const result = await executor.execute('https://hello.com');
    expect(result).toBe('GET:https://hello.com');
  });

  it('should call POST and return after-processed data', async () => {
    const result = await executor.execute(
      'https://hello.com',
      'payload',
      'POST',
    );
    expect(result).toBe('POST:https://hello.com:payload');
  });

  it('should handle errors in execute', async () => {
    class ErrorExecutor extends TestExecutor {
      protected override async get(url: string): Promise<ApiResponse<string>> {
        throw new Error(`fail ${url}`);
      }
    }

    const failExec = new ErrorExecutor({
      httpService: mockHttpService as HttpService,
      axiosFilterService,
    });

    const result = await failExec.execute('https://fail.com');
    expect(result).toEqual({
      data: 'error',
      message: 'fail https://fail.com',
      statusCode: 500,
    });
  });

  it('should attach interceptor during executor construction', () => {
    const spy = jest.spyOn(
      mockHttpService.axiosRef.interceptors.response,
      'use',
    );

    new TestExecutor({
      httpService: mockHttpService as HttpService,
      axiosFilterService,
    });

    expect(spy).toBeCalledTimes(1);
  });
});
