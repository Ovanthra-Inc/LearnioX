"use client"

import * as React from "react"
import Link from "next/link"
import { Play, Sparkles, Flame, Clock, Award, ArrowRight } from "lucide-react"
import { ActiveLearningProgress } from "@/hooks/useLearningProgress"

interface CourseProgressCardProps {
  progress: ActiveLearningProgress
}

export function CourseProgressCard({ progress }: CourseProgressCardProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress.progress_percentage)))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-br from-card via-card/90 to-primary/5 p-5 sm:p-6 shadow-sm transition-all hover:border-primary/40">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Card Header: Tag & Streak Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3" />
            Continue Learning
          </span>
          <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
            Active Track
          </span>
        </div>

        {/* Streak Flame Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-amber-500 text-xs font-semibold">
          <Flame className="size-3.5 fill-amber-500" />
          <span>{progress.streak_days} Day Streak</span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="space-y-1.5 mb-5">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans line-clamp-1">
          {progress.course_title}
        </h2>
        {progress.last_lesson_title && (
          <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5">
            <Clock className="size-3 text-muted-foreground/70 shrink-0" />
            <span>Next: <strong className="text-foreground/90 font-medium">{progress.last_lesson_title}</strong></span>
          </p>
        )}
      </div>

      {/* Progress Bar & Stats */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            {progress.completed_lessons} of {progress.total_lessons} Lessons
          </span>
          <span className="font-bold text-primary">{percentage}%</span>
        </div>

        {/* Visual Progress Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Award className="size-3.5 text-primary shrink-0" />
          <span>Certificate unlocked at 100%</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${progress.course_id}/learn`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Play className="size-3.5 fill-current" />
            <span>Resume Lesson</span>
          </Link>
          <Link
            href={`/courses/${progress.course_id}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <span>Overview</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
