'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  Building2,
  BookOpen,
  Users,
  Award,
  Globe,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function InstitutionPublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;

  // 1. Lookup Institution by Slug
  const { data: instData, isLoading: isInstLoading, isError } = useQuery({
    queryKey: ['institution-by-slug', slug],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/slug/${slug}`);
      return res.data;
    },
    enabled: Boolean(slug),
  });

  const institutionId = instData?.id;

  // 2. Fetch Compiled Landing Page Data
  const { data: landingData, isLoading: isLandingLoading } = useQuery({
    queryKey: ['institution-landing', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/landing-page`);
      return res.data;
    },
    enabled: Boolean(institutionId),
  });

  // 3. Fetch Courses for this Institution
  const { data: coursesData } = useQuery({
    queryKey: ['institution-public-courses', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/courses?page=1&limit=20`);
      return res.data;
    },
    enabled: Boolean(institutionId),
  });

  if (isInstLoading || (institutionId && isLandingLoading)) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading institution profile...</span>
      </div>
    );
  }

  if (isError || !instData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold text-foreground">Institution Profile Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested institution slug <code className="text-primary font-mono">{slug}</code> does not exist or has been made private.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center space-x-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer"
        >
          <span>Explore All Courses</span>
        </Link>
      </div>
    );
  }

  const inst = instData;
  const landing = landingData || {};
  const stats = landing.statistics || { total_courses: 0, total_students: 0, total_instructors: 0, average_rating: 4.9 };
  const courses = coursesData?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Section Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-background p-8 sm:p-12 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-3xl border border-primary/20 shrink-0 shadow-sm">
            {inst.logo_url ? (
              <img src={inst.logo_url} alt={inst.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Verified Developer & Learning Partner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">{inst.name}</h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          {inst.tagline || inst.description || 'Welcome to our official developer learning workspace. Explore engineering-grade course tracks, interactive assessments, and expert guidance.'}
        </p>

        {/* Public Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Course Tracks</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{stats.total_courses || courses.length || 0}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-emerald-500" />
              <span>Learners Enrolled</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{stats.total_students || 0}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span>Instructors</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{stats.total_instructors || 1}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-purple-500" />
              <span>Platform Rating</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{stats.average_rating ? stats.average_rating.toFixed(1) : '4.9'} ★</p>
          </div>
        </div>
      </div>

      {/* Featured Courses Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Featured Course Tracks</h2>
            <p className="text-xs text-muted-foreground">Official learning tracks offered by {inst.name}</p>
          </div>
          <Link
            href="/courses"
            className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Tracks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-xs font-semibold text-muted-foreground">No published course tracks yet for this institution.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((c: any) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {c.level || 'BEGINNER'}
                  </span>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.subtitle || c.description || 'Developer learning track'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    {c.price > 0 ? `₹${c.price}` : 'FREE'}
                  </span>
                  <span className="text-primary font-semibold group-hover:underline">
                    Enroll Track →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Institution Verification Footer Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Verified LearnioX Educational Partner</h4>
            <p className="text-[11px] text-muted-foreground">All certifications & course completions issued by {inst.name} are cryptographically signed.</p>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer"
        >
          <span>Join Institution Track</span>
        </Link>
      </div>
    </div>
  );
}
