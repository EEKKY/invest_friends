import { AxiosError } from 'axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ApiError } from './dto/axios.dto';
import { resolveErrorStrategy } from './error_handler/axios-strategy.handler';

@Injectable()
export class AxiosWrapper {
  constructor(private readonly httpService: HttpService) {}

  private readonly compiledStrategies = resolveErrorStrategy('EXTERNAL');

  async post<T, U>(url: string, data?: U, header?: unknown): Promise<T> {
    try {
      const response: { data: T } = await firstValueFrom(
        this.httpService.post(url, data, header),
      );
      return response.data;
    } catch (e) {
      throw this.handle(e);
    }
  }

  async get<T>(url: string, header?: unknown): Promise<T> {
    try {
      const { data }: { data: T } = await firstValueFrom(
        this.httpService.get(url, header),
      );
      return data;
    } catch (e) {
      throw this.handle(e);
    }
  }

  handle(error: AxiosError): ApiError<unknown> {
    const url = error.config?.url ?? 'unknown_url';
    const strategy = this.compiledStrategies(url);
    return strategy(error);
  }
}
