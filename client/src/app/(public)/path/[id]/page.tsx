"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Play, ArrowRight, ShieldCheck, Clock, BookOpen } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Program } from "@/types/course";

interface PathPageProps {
  params: Promise<{ id: string }>;
}

const MOCK_PATHS: (Program & { totalHours: number })[] = [
  {
    id: "path-1",
    slug: "ml-engineer",
    title: "Production Machine Learning Engineer",
    description: "From beginner Python core foundations to complete model deployment and drift metrics tracking in MLOps.",
    institutionId: "inst-3",
    totalHours: 180 * 3600,
    courseIds: ["course-1", "course-5"],
    isPublished: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-05-01T00:00:00Z"
  },
  {
    id: "path-2",
    slug: "frontend-designer",
    title: "Senior Frontend Engineer & Designer",
    description: "Master React component architectures, custom design systems, and visual design layouts.",
    institutionId: "inst-3",
    totalHours: 110 * 3600,
    courseIds: ["course-4", "course-3"],
    isPublished: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-04-20T00:00:00Z"
  }
];

export default function LearningPathPage({ params }: PathPageProps) {
  const { id } = use(params);

  const path = MOCK_PATHS.find((p) => p.id === id || p.slug === id) || MOCK_PATHS[0];
  const pathCourses = path.courseIds.map((cid) => 
    MOCK_COURSES.find((c) => c.id === cid)
  ).filter(Boolean) as typeof MOCK_COURSES;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>

      {/* Hero header */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-4">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Career Program
        </span>
        <h1 className="text-headline-lg font-bold text-foreground leading-tight">
          {path.title}
        </h1>
        <p className="text-body-md text-muted-foreground leading-relaxed max-w-3xl">
          {path.description}
        </p>

        <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground font-mono uppercase tracking-wider font-bold">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-foreground" /> {formatDuration(path.totalHours)} Content</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-foreground" /> {pathCourses.length} Courses</span>
        </div>
      </div>

      {/* Path Stepper */}
      <div className="space-y-6">
        <h3 className="text-headline-sm font-bold uppercase tracking-tight">Program Course Sequence</h3>
        <div className="relative border-l border-border pl-6 ml-4 space-y-8">
          {pathCourses.map((course, idx) => (
            <div key={course.id} className="relative">
              {/* Stepper Dot */}
              <div className="absolute -left-10 top-1 w-8 h-8 bg-foreground text-background flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </div>

              {/* Course details card */}
              <div className="border border-border bg-card p-5 max-w-3xl hover:border-foreground transition-colors space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      {course.institutionName}
                    </span>
                    <h4 className="text-body-lg font-bold text-foreground mt-0.5">{course.title}</h4>
                  </div>
                  <span className="text-xs font-mono border border-border px-2 py-0.5 uppercase tracking-wider">
                    {course.level}
                  </span>
                </div>
                <p className="text-body-sm text-muted-foreground">{course.shortDescription}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>{course.totalLessons} Lessons</span>
                    <span>{formatDuration(course.totalDuration)}</span>
                  </div>
                  <Link
                    href={`/course/${course.slug}`}
                    className="text-label-sm uppercase tracking-wider font-bold text-foreground hover:underline flex items-center gap-1"
                  >
                    View Course <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
