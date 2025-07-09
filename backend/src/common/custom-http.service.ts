import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomHttpService {
  private readonly httpService: HttpService;

  constructor(httpService: HttpService, AxiosFilterService) {
    this.httpService = httpService;
    httpService.axiosRef.interceptors.response.use(
        response => response,
        error => {
            AxiosFilterService.handle(error);
        }
    );
  }

  async get<T>(url: string) : Promise<T> {
    return this.httpService.axiosRef.get(url)
  }
}
