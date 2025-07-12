import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosFilterService } from './axios/axios-filter.service';

@Injectable()
export class CustomHttpService {
  private readonly httpService: HttpService;

  constructor(
    httpService: HttpService,
    axiosFilterService: AxiosFilterService,
  ) {
    this.httpService = httpService;
    httpService.axiosRef.interceptors.response.use(
      (response) => response,
      (error) => {
        axiosFilterService.handle(error);
      },
    );
  }

  async get<T>(url: string): Promise<T> {
    return this.httpService.axiosRef.get(url);
  }
}