import { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '../axios.dto';

export interface AxiosFilter {
  attach(instance: AxiosInstance): void;
  handle(error: AxiosError): ApiError<unknown>;
}
