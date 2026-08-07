'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setUser, logout as logoutAction, UserProfile } from '@/store/slices/authSlice';
import { useEffect } from 'react';

export function useAuth() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);

  // Fetch logged-in user profile on load
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token'));

  const { data: profileResponse, isLoading: isProfileLoading, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return null;
      const res = await apiClient.get<any, ApiResponse<UserProfile>>('/auth/me');
      return res.data;
    },
    enabled: hasToken,
    retry: false,
  });


  useEffect(() => {
    if (profileResponse) {
      dispatch(setUser({ user: profileResponse }));
    } else if (isError) {
      dispatch(logoutAction());
    }
  }, [profileResponse, isError, dispatch]);

  // Google Auth URL query launcher
  const fetchGoogleAuthUrl = async () => {
    const res = await apiClient.get<any, ApiResponse<{ url: string }>>('/auth/google');
    return res.data.url;
  };

  // Google callback mutation
  const loginWithCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.get<any, ApiResponse<{ access_token: string; refresh_token: string; user: UserProfile }>>(
        `/auth/google/callback?code=${encodeURIComponent(code)}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      dispatch(setUser({ user: data.user, accessToken: data.access_token }));
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
      }
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
    logout: logoutMutation.mutate,
  };
}
