import { Test, TestingModule } from '@nestjs/testing';
import { AxiosFilterService } from './error_handler/axios-filter.service';
import { AbstractHttpExecutor } from './axios-abstract';
import { AxiosInstance, AxiosError } from 'axios';

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

class TestExecutor extends AbstractHttpExecutor<any, any> {
  protected async get(url: string) {
    return { data: `GET:${url}`, statusCode: 200 };
  }
  protected async post(url: string, data: any) {
    return { data: `POST:${url}:${data}`, statusCode: 201 };
  }
  protected async handleError(error: unknown) {
    return `Handled: ${(error as Error).message}`;
  }
  protected after(res: any) {
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
    const instance = { interceptors: { response: { use: jest.fn() } } } as any;
    service.attach(instance);
    service.attach(instance);
    expect(instance.interceptors.response.use).toBeCalledTimes(1);
  });

  it('should handle error with matched strategy', () => {
    const error = {
      config: { url: 'https://test.com/any' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.message).toMatch(/Test API Error/);
  });


   it('should handle test.com strategy', () => {
    const error = {
      config: { url: 'https://test.com/endpoint' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('Test Api Not Found');
    expect(handled.message).toBe('Test API Error');
    expect(handled.statusCode).toBe(404);
  });

  it('should handle asset.com strategy', () => {
    const error = {
      config: { url: 'https://asset.com/resource' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('Asset Api Not Found');
    expect(handled.message).toBe('Asset API Error');
    expect(handled.statusCode).toBe(404);
  });

  it('should fallback to default strategy for unmatched url', () => {
    const error = {
      config: { url: 'https://unknown.com/something' },
      isAxiosError: true,
    } as AxiosError;

    const handled = service.handle(error);
    expect(handled.data).toBe('No matched api');
    expect(handled.message).toMatch(/Unhandled error at https:\/\/unknown\.com\/something/);
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
      httpService: mockHttpService as any,
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
      protected override async get(url: any): Promise<any>{
        throw new Error('fail');
      }
    }
    const failExec = new ErrorExecutor({
      httpService: mockHttpService as any,
      axiosFilterService,
    });
    const result = await failExec.execute('https://fail.com');
    expect(result).toBe('Handled: fail');
  });
  
  it('should attach interceptor during executor construction', () => {
    const spy = jest.spyOn(mockHttpService.axiosRef.interceptors.response, 'use');
    new TestExecutor({
      httpService: mockHttpService as any,
      axiosFilterService,
    });
    expect(spy).toBeCalledTimes(1);
  });
});
