import { Injectable } from '@nestjs/common';
import { AxiosFilter } from './axios-filter.interface';
import { axiosErrorStrategies } from './axios-filter.handler';

@Injectable()
export class AxiosFilterService implements AxiosFilter<unknown> {
  // thisis axios filter service
  // it will handle axios errors and return a response with status code 500 and error message

  handle(error) {
    const url = error.config?.url;
    const matched = Object.entries(axiosErrorStrategies).find(([pattern]) =>
      new RegExp(pattern).test(url),
    );

    const strategy = matched?.[1] ?? axiosErrorStrategies['.*'];
    return strategy(error);
  }
}
