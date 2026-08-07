'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseDetail, useCourses } from '@/hooks/useCourses';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  Clock,
  Layers,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();

  const { data: course, isLoading } = useCourseDetail(courseId);
  const { enrollInCourse, isEnrolling, purchaseCourse, isPurchasing } = useCourses();

  const [couponCode, setCouponCode] = useState('');

  // Fetch curriculum modules & lessons
  const { data: modulesData } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const res = await apiClient.get<any, ApiResponse<any[]>>(`/courses/${courseId}/modules`);
      return res.data;
    },
    enabled: Boolean(courseId),
  });

  const modules = modulesData || [];

  const handleEnroll = async () => {
    const isPaid = course?.price && course.price > 0;
    const toastId = toast.loading(isPaid ? 'Processing purchase & enrollment...' : 'Enrolling in course...');
    try {
      if (isPaid) {
        await purchaseCourse({ courseId, couponCode: couponCode.trim() || undefined });
        toast.success('Course purchased and enrolled successfully!', { id: toastId });
      } else {
        await enrollInCourse(courseId);
        toast.success('Enrolled in course successfully!', { id: toastId });
      }
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed', { id: toastId });
    }
  };

  if (isLoading || !course) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-32 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  const isPending = isEnrolling || isPurchasing;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {course.level || 'ALL LEVELS'}
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              {course.access_type || 'FREE'}
            </span>
          </div>

          <span className="text-xl font-bold text-foreground">
            {course.price > 0 ? `${course.currency || '₹'}${course.price}` : 'FREE ENROLLMENT'}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            {course.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            {course.subtitle || course.description || 'Comprehensive institution curriculum track.'}
          </p>
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          {course.price > 0 && (
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon Code (Optional)"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-48"
            />
          )}

          <button
            type="button"
            onClick={handleEnroll}
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            <span>
              {isPending
                ? 'Processing...'
                : course.price > 0
                ? 'Purchase & Enroll'
                : 'Enroll Now Free'}
            </span>
          </button>
        </div>
      </div>

      {/* Curriculum Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground font-sans flex items-center">
          <Layers className="h-4 w-4 mr-2 text-primary" />
          Course Curriculum & Modules ({modules.length})
        </h2>

        {modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-xs text-muted-foreground">
            Curriculum details will be released by the institution instructor soon.
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod: any, idx: number) => (
              <div key={mod.id || idx} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Module {idx + 1}: {mod.title}
                </h3>
                {mod.description && (
                  <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

