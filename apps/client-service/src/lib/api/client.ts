import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/auth';
import { API_ENDPOINTS } from './endpoints';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}/api/v1`;
    }
  }
  return '/api/v1';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enables automatic HttpOnly dual-cookie credentials
});

// Interceptor 1: Inject Bearer token from localStorage as fallback
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Automatic 401 Token Refresh & Mutex Queue
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data, // Unwraps outer Axios response to APIResponse<T>
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/signup') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint && typeof window !== 'undefined') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      try {
        const refreshResponse = await axios.post<ApiResponse<{ access_token: string; refresh_token?: string }>>(
          `${getApiBaseUrl()}${API_ENDPOINTS.AUTH.REFRESH}`,
          refreshToken ? { refresh_token: refreshToken } : {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.access_token;
        const newRefreshToken = refreshResponse.data.data.refresh_token;

        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);
