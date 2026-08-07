'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  Users,
  Award,
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

export default function HomePage() {
  const { courses, isLoading } = useCourses({ limit: 6 });

  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-sm space-y-6 relative overflow-hidden">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>LearnioX v1.0 Production Platform</span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-sans leading-tight">
              Master Developer Tracks & Institution Learning
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Engineering-grade course authoring, assessment evaluation, and multi-tenant institution management powered by Python microservices and Nginx ingress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/courses"
              className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary/90 px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer"
            >
              <span>Browse Course Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center space-x-2 rounded-md border border-input bg-secondary hover:bg-accent px-5 py-2.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <span>Get Started Free</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">
              Multi-Tenant Institutions
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create organizations, assign custom roles, invite team members, and manage courses seamlessly.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">
              API Gateway Ingress
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Proxied via Python FastAPI BFF API Gateway & Nginx for sub-millisecond route optimization.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">
              Quizzes & Evaluation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instant automated assessment grading, lesson progress tracking, and certificate generation.
            </p>
          </div>
        </div>
      </section>

      {/* Top Courses Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
              Featured Institution Courses
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top rated courses available for instant enrollment.
            </p>
          </div>
          <Link href="/courses" className="text-xs font-semibold text-primary hover:underline">
            View All ({courses.length})
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-xs text-muted-foreground">
            No public courses published yet. Log in to create your first course.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((c: any) => (
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
                    {c.subtitle || c.description || 'Institution course track'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    {c.price > 0 ? `${c.currency || '₹'}${c.price}` : 'FREE'}
                  </span>
                  <span className="text-primary font-semibold group-hover:underline">
                    Enroll →
                  </span>
                </div>
              </Link>
            ))}
          </div>

        )}
      </section>
    </div>
  );
}
