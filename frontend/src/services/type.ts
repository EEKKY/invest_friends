// 기본 API 응답 타입
export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// 에러 응답 타입
export type ApiError = {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
};

// 페이지네이션 타입
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// API 요청 상태 타입
export type RequestState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
