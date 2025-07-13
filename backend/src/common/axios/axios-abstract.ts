import axios from "axios";
import { HttpService } from "@nestjs/axios";
import { ApiResponse } from "./axios.dto";
import { AxiosFilterService } from "./error_handler/axios-filter.service";

export interface ExecutorDependencies {
  httpService: HttpService;
  axiosFilterService: AxiosFilterService;
}

export abstract class AbstractHttpExecutor<T, E = unknown> {
  protected readonly httpService: HttpService;
  protected readonly axiosFilterService: AxiosFilterService;
  constructor(deps: ExecutorDependencies) {
    this.axiosFilterService = deps.axiosFilterService;
    this.httpService = deps.httpService;
    this.axiosFilterService.attach(this.httpService.axiosRef);

  }

  async execute(url: string, data?: T, type: 'GET' | 'POST' = 'GET'): Promise<T | E> {
    try {
      const res = type === 'POST' ? await this.post(url, data!) : await this.get(url);
      return this.after(res);
    } catch (err) {
      return this.handleError(err);
    }
  }

  protected abstract get(url: string): Promise<ApiResponse<T>>;
  protected abstract post(url: string, data: T): Promise<ApiResponse<T>>;
  protected abstract handleError(error: unknown): Promise<E>;
  protected abstract after(res: ApiResponse<T>): T;
}
