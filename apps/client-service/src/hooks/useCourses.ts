'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';

export interface Course {
  id: string;
  institution_id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  thumbnail_url?: string;
  price: number;
  currency: string;
  level: string;
  access_type: string;
  status: string;
  total_modules?: number;
  total_lessons?: number;
  created_at: string;
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export function useCourses(params: CourseListParams = {}) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 20, category, search } = params;

  // List public courses
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses', { page, limit, category, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('page', String(page));
      searchParams.append('limit', String(limit));
      if (category) searchParams.append('category', category);
      if (search) searchParams.append('search', search);

      const res = await apiClient.get<any, ApiResponse<{ items: Course[]; total: number }>>(
        `/courses?${searchParams.toString()}`
      );
      return res.data;
    },
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiClient.post<any, ApiResponse<any>>(`/courses/${courseId}/enroll`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });

  // Course purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => {
      const res = await apiClient.post<any, ApiResponse<any>>(`/courses/${courseId}/purchase`, {
        coupon_code: couponCode,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
    },
  });

  return {
    courses: coursesData?.items || [],
    totalCourses: coursesData?.total || 0,
    isLoading,
    error,
    enrollInCourse: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
    purchaseCourse: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
  };
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await apiClient.get<any, ApiResponse<Course>>(`/courses/${courseId}`);
      return res.data;
    },
    enabled: Boolean(courseId),
  });
}
