import { AxiosError } from 'axios';
import { ApiError } from '../axios.dto';

export type AxiosErrorStrategy<T> = (error: AxiosError) => ApiError<T>;
export const axiosErrorStrategies: Record<
  string,
  AxiosErrorStrategy<unknown>
> = {
  'https://test.com/.*': (error) => ({
    data: 'Test Api Not Found',
    message: `Test API Error ${error.config?.url}`,
    statusCode: 404,
  }),
  'https://asset.com/.*': (error) => ({
    data: 'Asset Api Not Found',
    message: `Asset API Error ${error.config?.url}`,
    statusCode: 404,
  }),
  '.*': (error) => ({
    data: 'No matched api',
    message: `Unhandled error at ${error.config?.url}`,
    statusCode: 500,
  }),
};
