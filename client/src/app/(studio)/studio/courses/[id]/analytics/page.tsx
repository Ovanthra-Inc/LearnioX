"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Users, Clock, Award, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface CourseAnalyticsProps {
  params: Promise<{ id: string }>;
}

export default function CourseAnalyticsPage({ params }: CourseAnalyticsProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  return (
    <div className="max-w-[900px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/courses"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      {/* Header */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Performance Dashboard</span>
          <h1 className="text-headline-sm font-bold text-foreground mt-0.5">{course.title}</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          <div className="p-4 text-center border-r border-border">
            <p className="text-body-lg font-bold text-foreground">{formatNumber(course.enrollmentCount)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Enrollments</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-body-lg font-bold text-foreground">{course.rating}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Average Rating</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-body-lg font-bold text-foreground">{course.completionRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Completion Rate</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-body-lg font-bold text-foreground">{formatNumber(course.reviewCount)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total Reviews</p>
          </div>
        </div>

        {/* Analytics Insights */}
        <div className="border border-border p-5 bg-surface space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" /> Copilot Analytics Insight
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enrollments are up 14% this month following the launching of the NumPy vectorization promo. We noticed a minor drop-off (8%) at Module 2: NumPy calculations, indicating the practice assignment description may need slight easing.
          </p>
        </div>
      </div>
    </div>
  );
}
