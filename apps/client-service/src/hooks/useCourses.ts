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
  category?: { id?: string; name: string };
  institution?: { id?: string; name: string; slug?: string };
  enrolled_count?: number;
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export function useCourses(params: CourseListParams = {}) {
  const queryClient = useQueryClient();
  const page = params.page || 1;
  const limit = params.limit || params.pageSize || 20;
  const { category, search } = params;

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

  // Checkout mutation (initiates order)
  const checkoutMutation = useMutation({
    mutationFn: async ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => {
      const res = await apiClient.post<any, ApiResponse<any>>(`/courses/${courseId}/checkout`, {
        coupon_code: couponCode,
      });
      return res.data;
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: { payment_id: string; provider_payment_id: string; provider_order_id?: string; signature?: string }) => {
      const res = await apiClient.post<any, ApiResponse<any>>(`/purchases/verify`, payload);
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
    checkoutCourse: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifyingPayment: verifyPaymentMutation.isPending,
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

export interface LessonContentItem {
  id: string;
  lesson_id: string;
  file_id?: string;
  file_url?: string;
  external_url?: string;
  text_content?: string;
  content_type: string;
}

export interface LessonResourceItem {
  id: string;
  lesson_id: string;
  file_id: string;
  file_url?: string;
  title: string;
}

export interface StructureLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  lesson_type: string;
  duration: number;
  visibility: string;
  status: string;
  is_preview: boolean;
  position: number;
  content?: LessonContentItem;
  resources: LessonResourceItem[];
}

export interface StructureModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  position: number;
  is_free: boolean;
  is_published: boolean;
  lessons: StructureLesson[];
}

export interface CourseStructure {
  course_id: string;
  modules: StructureModule[];
}

export function useCourseStructure(courseId: string) {
  return useQuery({
    queryKey: ['course-structure', courseId],
    queryFn: async () => {
      if (!courseId || courseId === 'default') return null;
      try {
        const res = await apiClient.get<any, ApiResponse<CourseStructure>>(
          `/courses/${courseId}/structure`
        );
        return res.data;
      } catch (e) {
        console.error('Failed to fetch course structure:', e);
        return null;
      }
    },
    enabled: Boolean(courseId) && courseId !== 'default',
  });
}

export interface EnrolledCourseRecord {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  access_type: string;
  enrolled_at: string;
  expires_at?: string;
  completed_at?: string;
  course?: Course;
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<{ items: EnrolledCourseRecord[]; total: number }>>(
        '/users/me/enrollments'
      );
      return res.data?.items || [];
    },
  });
}

export function useCurriculumMutations() {
  const queryClient = useQueryClient();

  const createCourseMutation = useMutation({
    mutationFn: async (payload: {
      institution_id: string;
      title: string;
      subtitle?: string;
      description: string;
      level?: string;
      access_type?: string;
      price?: number;
      currency?: string;
      category_id?: string;
    }) => {
      const res = await apiClient.post<any, ApiResponse<Course>>('/courses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async ({
      courseId,
      title,
      description,
      is_free,
    }: {
      courseId: string;
      title: string;
      description?: string;
      is_free?: boolean;
    }) => {
      const res = await apiClient.post<any, ApiResponse<StructureModule>>(
        `/courses/${courseId}/modules`,
        { title, description, is_free: Boolean(is_free) }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-structure', variables.courseId] });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async ({
      moduleId,
      courseId,
      title,
      description,
      lesson_type = 'VIDEO',
      visibility = 'ENROLLED',
      is_preview = false,
    }: {
      moduleId: string;
      courseId?: string;
      title: string;
      description?: string;
      lesson_type?: string;
      visibility?: string;
      is_preview?: boolean;
    }) => {
      const res = await apiClient.post<any, ApiResponse<StructureLesson>>(
        `/modules/${moduleId}/lessons`,
        { title, description, lesson_type, visibility, is_preview }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      if (variables.courseId) {
        queryClient.invalidateQueries({ queryKey: ['course-structure', variables.courseId] });
      }
    },
  });

  const attachLessonContentMutation = useMutation({
    mutationFn: async ({
      lessonId,
      fileId,
      externalUrl,
      textContent,
      contentType = 'VIDEO',
    }: {
      lessonId: string;
      fileId?: string;
      externalUrl?: string;
      textContent?: string;
      contentType?: string;
    }) => {
      const res = await apiClient.post<any, ApiResponse<LessonContentItem>>(
        `/lessons/${lessonId}/content`,
        { file_id: fileId, external_url: externalUrl, text_content: textContent, content_type: contentType }
      );
      return res.data;
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      lessonId,
      watchTime,
      lastPosition,
    }: {
      lessonId: string;
      watchTime: number;
      lastPosition: number;
    }) => {
      const res = await apiClient.patch<any, ApiResponse<any>>(`/lessons/${lessonId}/progress`, {
        watch_time: watchTime,
        last_position: lastPosition,
      });
      return res.data;
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await apiClient.post<any, ApiResponse<any>>(`/lessons/${lessonId}/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continue-learning'] });
    },
  });

  return {
    createCourse: createCourseMutation.mutateAsync,
    isCreatingCourse: createCourseMutation.isPending,
    createModule: createModuleMutation.mutateAsync,
    isCreatingModule: createModuleMutation.isPending,
    createLesson: createLessonMutation.mutateAsync,
    isCreatingLesson: createLessonMutation.isPending,
    attachLessonContent: attachLessonContentMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    completeLesson: completeLessonMutation.mutateAsync,
  };
}
