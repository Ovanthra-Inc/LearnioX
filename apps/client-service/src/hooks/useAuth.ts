'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setUser, logout as logoutAction } from '@/store/slices/authSlice';
import {
  ApiResponse,
  UserProfile,
  TokenResponse,
  LoginPayload,
  SignupPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import { useEffect } from 'react';

export function useAuth() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);

  // Fetch authenticated user profile using HttpOnly cookie or Bearer token
  const { data: profileData, isLoading: isProfileLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<UserProfile>>(API_ENDPOINTS.AUTH.ME);
      return res?.data || res;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  useEffect(() => {
    if (profileData && profileData.id) {
      dispatch(setUser({ user: profileData }));
    } else if (isError) {
      dispatch(logoutAction());
    }
  }, [profileData, isError, dispatch]);

  // Google OAuth URL fetcher
  const fetchGoogleAuthUrl = async () => {
    const res: any = await apiClient.get(API_ENDPOINTS.AUTH.GOOGLE_AUTH);
    const url = res?.data?.url || res?.url || (typeof res === 'string' ? res : null);
    if (!url) {
      throw new Error(res?.message || 'Server did not return a valid Google authentication URL');
    }
    return url;
  };

  // Google Callback code exchange mutation
  const loginWithCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res: any = await apiClient.get(
        `${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${encodeURIComponent(code)}`
      );
      const payload = res?.data || res;
      if (!payload?.access_token) {
        throw new Error(res?.message || 'Failed to exchange authorization code for session tokens');
      }
      return payload;
    },
    onSuccess: (data) => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      if (data.user) {
        dispatch(setUser({ user: data.user, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Email & Password Signup mutation
  const signupWithEmailMutation = useMutation({
    mutationFn: async (data: SignupPayload) => {
      const res: any = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
      return res?.data || res;
    },
    onSuccess: (data) => {
      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data?.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      if (data?.user) {
        dispatch(setUser({ user: data.user, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Email & Password Login mutation
  const loginWithEmailMutation = useMutation({
    mutationFn: async (data: LoginPayload) => {
      const res: any = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
      const payload = res?.data || res;
      if (!payload?.access_token) {
        throw new Error(res?.message || 'Login failed');
      }
      return payload;
    },
    onSuccess: (data) => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      if (data.user) {
        dispatch(setUser({ user: data.user, accessToken: data.access_token }));
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Email Verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const res: any = await apiClient.post(
        `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`
      );
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Resend Email Verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res: any = await apiClient.post(
        `${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}?email=${encodeURIComponent(email)}`
      );
      return res?.data || res;
    },
  });

  // Forgot Password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res: any = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return res?.data || res;
    },
  });

  // Reset Password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordPayload) => {
      const res: any = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
      return res?.data || res;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        refreshToken ? { refresh_token: refreshToken } : {}
      ).catch(() => {});
    },
    onSettled: () => {
      dispatch(logoutAction());
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: loading || isProfileLoading,
    fetchGoogleAuthUrl,
    loginWithCode: loginWithCodeMutation.mutateAsync,
    isLoggingIn: loginWithCodeMutation.isPending,
    signupWithEmail: signupWithEmailMutation.mutateAsync,
    isSigningUp: signupWithEmailMutation.isPending,
    loginWithEmail: loginWithEmailMutation.mutateAsync,
    isAuthenticating: loginWithEmailMutation.isPending,
    verifyEmail: verifyEmailMutation.mutateAsync,
    isVerifyingEmail: verifyEmailMutation.isPending,
    resendVerification: resendVerificationMutation.mutateAsync,
    isResendingVerification: resendVerificationMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingReset: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
