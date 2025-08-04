import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockRes: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockHost: ArgumentsHost;

  beforeEach((): void => {
    filter = new GlobalExceptionFilter();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHost = {
      switchToHttp: (): {
        getRequest: () => { url: string };
        getResponse: () => typeof mockRes;
      } => ({
        getRequest: (): { url: string } => ({ url: 'http://localhost/fake' }),
        getResponse: (): typeof mockRes => mockRes,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException and call res.json', (): void => {
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
