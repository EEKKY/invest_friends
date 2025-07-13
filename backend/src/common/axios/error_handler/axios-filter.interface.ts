import { AxiosError } from 'axios';
import { ApiError } from '../axios.dto';

export interface AxiosFilter {
  handle(error: AxiosError): ApiError;
}
