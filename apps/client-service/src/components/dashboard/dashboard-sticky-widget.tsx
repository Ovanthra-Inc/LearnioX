"use client"

import * as React from "react"
import Link from "next/link"
import {
  Flame,
  Target,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Code,
  GraduationCap,
  Building2,
  BellRing,
} from "lucide-react"
import { ActiveLearningProgress } from "@/hooks/useLearningProgress"

interface DashboardStickyWidgetProps {
  progress: ActiveLearningProgress
}

export function DashboardStickyWidget({ progress }: DashboardStickyWidgetProps) {
  // Weekly 7-day streak activity mock
  const weekDays = [
    { day: "M", completed: true },
    { day: "T", completed: true },
    { day: "W", completed: true },
    { day: "T", completed: true },
    { day: "F", completed: true },
    { day: "S", completed: false },
    { day: "S", completed: false },
  ]

  const weeklyPercentage = Math.min(
    100,
    Math.round((progress.weekly_hours_spent / progress.weekly_hours_target) * 100)
  )

  return (
    <div className="space-y-4">
      {/* 1. Weekly Learning Goals & Streak Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground font-sans">Weekly Goal</h3>
              <p className="text-[10px] text-muted-foreground">Study & Practice Target</p>
            </div>
          </div>

          <span className="text-xs font-bold text-primary">
            {progress.weekly_hours_spent} / {progress.weekly_hours_target} hrs
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${weeklyPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{weeklyPercentage}% Achieved</span>
            <span>Target: 6 hrs/week</span>
          </div>
        </div>

        {/* 7-Day Streak Row */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] mb-2 font-medium">
            <span className="flex items-center gap-1 text-foreground">
              <Flame className="size-3.5 text-amber-500 fill-amber-500" />
              <span>{progress.streak_days} Day Streak</span>
            </span>
            <span className="text-muted-foreground text-[10px]">Mon – Sun</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`size-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                    item.completed
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : "bg-secondary text-muted-foreground/60 border border-transparent"
                  }`}
                >
                  {item.day}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Pending Assignments & Notifications Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
              <BellRing className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground font-sans">Pending Tasks</h3>
              <p className="text-[10px] text-muted-foreground">Assignments & Submissions</p>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            2 Due
          </span>
        </div>

        {/* Task Item 1 */}
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground line-clamp-1">
              Microservices Gateway Lab
            </span>
            <span className="text-[9px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
              Due Tomorrow
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Complete FastAPI async proxy & request tracing test suite.
          </p>
        </div>

        {/* Task Item 2 */}
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground line-clamp-1">
              Database Indexing Assessment
            </span>
            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Due in 4 days
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Submit query execution plan optimization report.
          </p>
        </div>
      </div>

      {/* 3. Quick Shortcuts & Practice Labs */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-foreground font-sans mb-1">
          Quick Navigation
        </h4>

        <Link
          href="/courses"
          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="size-3.5 text-primary" />
            <span>Course Catalog</span>
          </div>
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/institution"
          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-primary" />
            <span>Institution Workspaces</span>
          </div>
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
