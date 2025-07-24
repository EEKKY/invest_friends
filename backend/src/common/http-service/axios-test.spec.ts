import { AxiosWrapper } from './axios-wrapper.service';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from './dto/axios.dto';

describe('AxiosWrapper', () => {
  let axiosWrapper: AxiosWrapper;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AxiosWrapper,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    axiosWrapper = module.get<AxiosWrapper>(AxiosWrapper);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('Error Strategy Pattern Matching', () => {
    it('should return custom error for https://test.com API', async () => {
      const testUrl = 'https://test.com/some-api';

      const fakeError = {
        isAxiosError: true,
        config: { url: testUrl },
        toJSON: () => ({}),
      } as AxiosError;

      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError(() => fakeError));

      await expect(axiosWrapper.get(testUrl)).rejects.toEqual({
        data: 'Test Api Not Found',
        message: `Test API Error ${testUrl}`,
        statusCode: 404,
      } as ApiError);
    });

    it('should fallback to default error when no pattern matches', async () => {
      const url = 'https://unknown.com/404';

      const fakeError = {
        isAxiosError: true,
        config: { url },
        toJSON: () => ({}),
      } as AxiosError;

      jest.spyOn(httpService, 'get').mockReturnValueOnce(throwError(() => fakeError));

      await expect(axiosWrapper.get(url)).rejects.toEqual({
        data: 'No matched api',
        message: `Unhandled error at ${url}`,
        statusCode: 500,
      } as ApiError);
    });
  });

  describe('Success Requests', () => {
    it('should return data on successful GET', async () => {
      const url = 'https://test.com/data';
      const result = {
        data: 'your mock response',
        status: 200,
        statusText: 'OK',
        headers: {},
      } as AxiosResponse;

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(result));

      const res = await axiosWrapper.get<typeof result.data>(url);
      expect(res).toEqual(result.data);
    });

    it('should return data on successful POST', async () => {
      const url = 'https://test.com/data';
      const postData = { a: 1 };
      const result = {
        data: 'posted',
        status: 200,
        statusText: 'OK',
        headers: {},
      } as AxiosResponse;

      jest.spyOn(httpService, 'post').mockReturnValueOnce(of(result));

      const res = await axiosWrapper.post<typeof result.data, typeof postData>(url, postData);
      expect(res).toEqual('posted');
    });
  });
});
