import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosFilterService } from './axios/error_handler/axios-filter.service';
import axios from "axios";
import { AbstractHttpExecutor } from './axios/axios-abstract';
import { ApiResponse } from './axios/axios.dto';

@Injectable()
export class CustomHttpService extends AbstractHttpExecutor<any> {
  private readonly httpService: HttpService;

  constructor(
    httpService: HttpService,
    axiosFilterService: AxiosFilterService,
  ) {
    super();

    this.httpService = httpService;
    httpService.axiosRef.interceptors.response.use(
      (response) => response,
      (error) => {

        if (axios.isAxiosError(error)) {
          axiosFilterService.handle(error);
        }

        return Promise.reject(error);
      },
    );
  }

  protected async request(url: string): Promise<ApiResponse<any>> {
    return this.httpService.axiosRef.get(url);
  }
  
  async post<T>(url: string, data: any): Promise<T> {
    return this.httpService.axiosRef.post(url, data);
  }

  async get<T>(url: string): Promise<T> {
    return this.httpService.axiosRef.get(url);
  }
}