import { useState, useCallback } from "react";
import { api } from "@/services/axios";
import type { ApiResponse, ApiError, RequestState } from "@/services/type";
import type { AxiosRequestConfig } from "axios";

export function useApi<T>() {
  const [state, setState] = useState<RequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api.request<ApiResponse<T>>({
          method,
          url,
          data,
          ...config,
        });

        setState({
          data: response.data.data,
          loading: false,
          error: null,
        });

        return response.data;
      } catch (error) {
        const apiError = error as { response?: { data: ApiError } };
        const errorMessage =
          apiError.response?.data?.message || "알 수 없는 오류가 발생했습니다.";

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        throw error;
      }
    },
    []
  );

  const get = useCallback(
    (url: string, config?: Record<string, unknown>) =>
      execute("GET", url, undefined, config),
    [execute]
  );

  const post = useCallback(
    (url: string, data?: unknown, config?: Record<string, unknown>) =>
      execute("POST", url, data, config),
    [execute]
  );

  const put = useCallback(
    (url: string, data?: unknown, config?: Record<string, unknown>) =>
      execute("PUT", url, data, config),
    [execute]
  );

  const del = useCallback(
    (url: string, config?: Record<string, unknown>) =>
      execute("DELETE", url, undefined, config),
    [execute]
  );

  const patch = useCallback(
    (url: string, data?: unknown, config?: Record<string, unknown>) =>
      execute("PATCH", url, data, config),
    [execute]
  );

  return {
    ...state,
    execute,
    get,
    post,
    put,
    delete: del,
    patch,
  };
}
