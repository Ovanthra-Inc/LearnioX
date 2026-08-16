import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAppDispatch } from '@/store/store';
import { setUser, logout as reduxLogout } from '@/store/slices/authSlice';
import {
  ApiResponse,
  UserProfile,
  TokenResponse,
  LoginPayload,
  SignupPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';

export const AUTH_QUERY_KEYS = {
  CURRENT_USER: ['auth', 'current-user'] as const,
  GOOGLE_AUTH_URL: ['auth', 'google-url'] as const,
  SESSIONS: ['auth', 'sessions'] as const,
};

export function useCurrentUserQuery(enabled: boolean = true) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.CURRENT_USER,
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.ME
      );
      if (res.data) {
        dispatch(setUser({ user: res.data }));
      }
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export function useLoginMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient.post<any, ApiResponse<TokenResponse>>(
        API_ENDPOINTS.AUTH.LOGIN,
        payload
      );
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      // Invalidate and fetch current user profile
      const userRes = await apiClient.get<any, ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.ME
      );
      if (userRes.data) {
        dispatch(setUser({ user: userRes.data, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.CURRENT_USER });
    },
  });
}

export function useSignupMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const res = await apiClient.post<any, ApiResponse<TokenResponse>>(
        API_ENDPOINTS.AUTH.SIGNUP,
        payload
      );
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      const userRes = await apiClient.get<any, ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.ME
      );
      if (userRes.data) {
        dispatch(setUser({ user: userRes.data, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.CURRENT_USER });
    },
  });
}

export function useGoogleCallbackMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state?: string }) => {
      const res = await apiClient.post<any, ApiResponse<TokenResponse>>(
        API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
        { code, state }
      );
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      const userRes = await apiClient.get<any, ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.ME
      );
      if (userRes.data) {
        dispatch(setUser({ user: userRes.data, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.CURRENT_USER });
    },
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await apiClient.post<any, ApiResponse<{ verified: boolean }>>(
        `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`
      );
      return res.data;
    },
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post<any, ApiResponse<{ sent: boolean }>>(
        `${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}?email=${encodeURIComponent(email)}`
      );
      return res.data;
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const res = await apiClient.post<any, ApiResponse<{ sent: boolean }>>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        payload
      );
      return res.data;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const res = await apiClient.post<any, ApiResponse<{ reset: boolean }>>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        payload
      );
      return res.data;
    },
  });
}

export function useLogoutMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      await apiClient.post<any, ApiResponse<null>>(
        API_ENDPOINTS.AUTH.LOGOUT,
        refreshToken ? { refresh_token: refreshToken } : {}
      );
    },
    onSettled: () => {
      dispatch(reduxLogout());
      queryClient.clear();
    },
  });
}
