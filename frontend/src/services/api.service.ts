import { api } from "@/services/axios";
import type { ApiResponse, PaginatedResponse } from "@/services/type";

// 사용자 관련 타입
export type User = {
  id: number;
  email: string;
  name: string;
  createdAt: string;
};

export type CreateUserRequest = {
  email: string;
  name: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  token: string;
};

// 사용자 API 서비스
export class UserApiService {
  static async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      data
    );
    return response.data;
  }

  static async register(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>("/auth/register", data);
    return response.data;
  }

  static async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>("/auth/profile");
    return response.data;
  }

  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>("/auth/profile", data);
    return response.data;
  }

  static async getUsers(
    page = 1,
    limit = 10
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
      `/users?page=${page}&limit=${limit}`
    );
    return response.data;
  }
}
