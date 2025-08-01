import { GlobalExceptionFilter } from './global-exception.filter';
import { resolveErrorStrategy } from './axios-strategy.handler';
import { ArgumentsHost, HttpException } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockRes: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({ url: 'http://localhost/fake' }),
        getResponse: () => mockRes,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException and call res.json', () => {
    const exception = new HttpException('test error', 500);

    filter.catch(exception, mockHost);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: 'No matched api',
      message: 'Unhandled error at HttpException',
      statusCode: 500, // 전략에 따라 변경 필요
    });
  });
});
