import { AxiosError } from 'axios';

export interface AxiosFilter<T> {
    handle(error: AxiosError) : T;
}