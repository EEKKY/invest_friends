import { AxiosError } from 'axios';
import { ApiError } from '../axios.dto';

type AxiosErrorStrategy<T> = (error: AxiosError) => ApiError<T>;
export const axiosErrorStrategies: Record<string, AxiosErrorStrategy<any>> = {
  'https://test.com/.*': (error) => ({
    data: 'Test Api Not Found',
    message: 'Test API Error',
    statusCode: 404,
  }),
  'https://asset.com/.*': (error) => ({
    data: 'Asset Api Not Found',
    message: 'Asset API Error',
    statusCode: 404,
  }),
  '.*': (error) => ({
    data: 'No matched api',
    message: `Unhandled error at ${error.config?.url}`,
    statusCode: 500,
  }),
};
