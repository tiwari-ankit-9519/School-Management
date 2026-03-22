"use client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./constants";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export interface ValidationError {
  code: string;
  message: string;
  path: (string | number)[];
}

export interface ApiErrorResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: { message: string }[];
  requestId?: string;
  stack?: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function isApiSuccess<T>(
  response: ApiResult<T>,
): response is ApiResponse<T> {
  return response.success === true;
}

export function isApiError(
  response: ApiResult<unknown>,
): response is ApiErrorResponse {
  return response.success === false;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (
      axiosError.response?.data?.errors &&
      axiosError.response.data.errors.length > 0
    ) {
      return axiosError.response.data.errors
        .map((err) => err.message)
        .join(", ");
    }

    return axiosError.message || "An error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}

export default api;
