import { Injectable } from '@nestjs/common';
import { AxiosFilter } from './axios-filter.interface';

@Injectable()
export class AxiosFilterService implements AxiosFilter<unknown>{
  // thisis axios filter service
  // it will handle axios errors and return a response with status code 500 and error message

  handle(error) {
    const url = error.config?.url;
    const status = error.response?.status;

    if (url?.includes(''))
      return {
        statusCode: 500,
        message: 'Internal Server Error',
      };
  }
}
