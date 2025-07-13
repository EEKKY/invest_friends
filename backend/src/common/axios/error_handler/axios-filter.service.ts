import axios, { AxiosError, AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import { AxiosFilter } from './axios-filter.interface';
import { axiosErrorStrategies } from './axios-filter.handler';
import { ApiError } from '../axios.dto';

@Injectable()
export class AxiosFilterService implements AxiosFilter {
  private attachedInstances: WeakSet<AxiosInstance> = new WeakSet();
  private readonly compiledStrategies = Object.entries(
    axiosErrorStrategies,
  ).map(([pattern, handler]) => ({ regex: new RegExp(pattern), handler }));

  attach(instance: AxiosInstance) {
    if (this.attachedInstances.has(instance)) {
      return;
    }

    this.attachedInstances.add(instance);
    instance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (axios.isAxiosError(err)) {
          return Promise.reject(this.handle(err));
        }

        return Promise.reject(err);
      },
    );
  }
  handle(error: AxiosError): ApiError {
    const url = error.config?.url;
    const strategy = this.compiledStrategies.find(({ regex }) =>
      regex.test(url),
    );

    return strategy.handler(error);
  }
}
