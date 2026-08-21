"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Layers,
  Clock,
  ArrowUpRight,
  Crown,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  MessagesSquare,
} from "lucide-react"
import { Course } from "@/hooks/useCourses"
import { cn } from "@/lib/utils"

interface CourseFeedItemProps {
  course: Course
  index?: number
}

export function CourseFeedItem({ course, index = 0 }: CourseFeedItemProps) {
  // Generate harmonious distinct gradient/palette for thumbnails based on index/slug
  const thumbnailThemes = [
    {
      bg: "from-blue-600/20 via-indigo-600/20 to-purple-600/20",
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      accent: "bg-indigo-500/10 text-indigo-400",
    },
    {
      bg: "from-emerald-600/20 via-teal-600/20 to-cyan-600/20",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      accent: "bg-emerald-500/10 text-emerald-400",
    },
    {
      bg: "from-amber-600/20 via-orange-600/20 to-rose-600/20",
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
      accent: "bg-amber-500/10 text-amber-400",
    },
    {
      bg: "from-purple-600/20 via-fuchsia-600/20 to-pink-600/20",
      border: "border-fuchsia-500/30",
      iconColor: "text-fuchsia-400",
      accent: "bg-fuchsia-500/10 text-fuchsia-400",
    },
  ]

  const theme = thumbnailThemes[index % thumbnailThemes.length]

  // Map course id / slug to community channel id
  const communityChannelId =
    course.id === "c2" || course.slug?.includes("ai")
      ? "comm-ai-rag"
      : course.id === "c3" || course.slug?.includes("devops")
      ? "comm-dist-sys"
      : "comm-fullstack"

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer gap-4 sm:gap-5"
    >
      {/* LEFT: Course Thumbnail Section */}
      <div
        className={cn(
          "relative flex aspect-video sm:aspect-4/3 w-full sm:w-48 md:w-52 shrink-0 items-center justify-center rounded-lg border bg-linear-to-br overflow-hidden shadow-inner transition-transform duration-200 group-hover:scale-[1.02]",
          theme.bg,
          theme.border
        )}
      >
        {/* Background Graphic Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Center Thumbnail Icon & Title */}
        <div className="relative flex flex-col items-center justify-center text-center p-3 z-10">
          <div className="flex size-10 items-center justify-center rounded-lg bg-background/80 shadow-xs backdrop-blur-xs mb-1.5 transition-transform group-hover:scale-110">
            <BookOpen className={cn("size-5", theme.iconColor)} />
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-foreground/80 font-mono">
            {course.level || "Track"}
          </span>
        </div>

        {/* Level Tag Overlay Bottom Left */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="inline-flex items-center rounded-md bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/90 backdrop-blur-xs shadow-xs">
            {course.level || "ALL LEVELS"}
          </span>
        </div>
      </div>

      {/* RIGHT: Course Metadata & Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0 space-y-3">
        {/* Header with Title & Top-Right Crown / Diamond Icon */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Verified Curriculum
              </span>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground font-sans group-hover:text-primary transition-colors line-clamp-1">
                {course.title}
              </h3>
            </div>

            {/* Top-Right Crown / Diamond Badge */}
            <div
              title="Verified Course"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-xs"
            >
              {index % 2 === 0 ? (
                <Crown className="size-3.5 fill-amber-500/40" />
              ) : (
                <Sparkles className="size-3.5 fill-amber-500/40" />
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1.5">
            {course.subtitle || course.description || "Comprehensive institution curriculum track and assessment series."}
          </p>
        </div>

        {/* Bottom Details & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs text-muted-foreground">
          {/* Module & Lesson Stats */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3.5 text-muted-foreground/70" />
              <span>{course.total_modules || 6} Modules</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-muted-foreground/70" />
              <span>{course.total_lessons || 20} Lessons</span>
            </span>
          </div>

          {/* Action CTAs: Community Connect + Explore */}
          <div className="flex items-center gap-2">
            {/* Community Connect Icon Button */}
            <span
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/community?channel=${communityChannelId}`
              }}
              title="Connect to Course Community Channel"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-2xs hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              <MessagesSquare className="size-3.5" />
              <span>Community Connect</span>
            </span>

            {/* Explore Course CTA */}
            <div className="inline-flex items-center gap-1 font-semibold text-foreground group-hover:text-primary transition-colors text-xs">
              <span>Explore Course</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
