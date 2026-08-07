'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token'));

  // Fetch student enrollments
  const { data: enrollmentsData, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<{ items: any[]; total: number }>>(
        '/users/me/enrollments'
      );
      return res.data;
    },
    enabled: hasToken,
  });


  const enrollments = enrollmentsData?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Welcome back, {user?.name || 'Learner'} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your course progress, complete active modules, and access institution resources.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors self-start md:self-auto cursor-pointer"
        >
          <span>Explore Course Catalog</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Enrolled Courses</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{enrollments.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {enrollments.filter((e) => e.status === 'ACTIVE').length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Courses</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {enrollments.filter((e) => e.status === 'COMPLETED').length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Certificates</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {enrollments.filter((e) => e.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Active Courses List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground font-sans">
            My Enrolled Courses
          </h2>
          <Link href="/courses" className="text-xs font-medium text-primary hover:underline cursor-pointer">
            View All Catalog
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">No active enrollments yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Browse our verified institution courses and start learning today.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center space-x-1.5 rounded-md bg-secondary hover:bg-accent px-3.5 py-2 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((item: any) => (
              <div
                key={item.enrollment_id || item.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.access_type || 'ENROLLED'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Enrolled {new Date(item.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1">
                    Course ID: {item.course_id}
                  </h3>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-500 flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Active Learning Status
                  </span>
                  <Link
                    href={`/courses/${item.course_id}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <span>Continue</span>
                    <PlayCircle className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
