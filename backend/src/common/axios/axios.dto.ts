export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message?: string;
  errorCode?: string;
}

export interface ApiError<T = string> {
  data: T;
  message: string;
  statusCode: number;
}