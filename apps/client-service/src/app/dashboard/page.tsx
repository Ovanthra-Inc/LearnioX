"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useLearningProgress } from "@/hooks/useLearningProgress"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import { CourseProgressCard } from "@/components/dashboard/course-progress-card"
import { CourseFeedItem } from "@/components/dashboard/course-feed-item"
import { DashboardStickyWidget } from "@/components/dashboard/dashboard-sticky-widget"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Loader2, Compass } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { activeCourse, courses, isLoading: isDataLoading } = useLearningProgress()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthLoading, isAuthenticated, router])

  if (isAuthLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex h-svh flex-col overflow-hidden bg-background text-foreground">
        {/* Mobile Top Avatar Floating Header (Visible on smaller screens) */}
        <div className="lg:hidden absolute top-3 right-4 z-30 flex items-center gap-2">
          <NavUser />
        </div>

        {/* Desktop 2-Column Fixed-Viewport Layout */}
        <div className="flex flex-1 h-full overflow-hidden">
          
          {/* CENTER COLUMN: Independently Scrollable Main Feed */}
          <main className="flex-1 h-full overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 lg:pt-8 pb-16">
            <div className="max-w-3xl xl:max-w-4xl mx-auto space-y-6">
              
              {/* 1. Top Featured Course Progress Card */}
              <section aria-label="Current Course Progress">
                <CourseProgressCard progress={activeCourse} />
              </section>

              {/* 2. Main Course Feed (One by one single-column list) */}
              <section aria-label="Course Curriculum Feed" className="space-y-4">
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Compass className="size-4 text-primary" />
                    <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
                      Explore Curriculum & Tracks
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {courses.length} Available Tracks
                  </span>
                </div>

                {/* Vertical list of single-column horizontal course cards */}
                <div className="space-y-4">
                  {isDataLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-36 rounded-xl border border-border bg-card animate-pulse"
                      />
                    ))
                  ) : (
                    courses.map((course, idx) => (
                      <CourseFeedItem key={course.id} course={course} index={idx} />
                    ))
                  )}
                </div>
              </section>

              {/* Mobile-only fallback widget placement at bottom of feed */}
              <div className="lg:hidden pt-6">
                <DashboardStickyWidget progress={activeCourse} />
              </div>

            </div>
          </main>

          {/* RIGHT COLUMN: Static Fixed Side Panel (Non-scrolling, avatar permanently at top right) */}
          <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 h-full flex-col border-l border-border/40 bg-card/20 p-5 xl:p-6 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Top-Right Permanent Avatar */}
            <div className="flex items-center justify-end pb-4 mb-1">
              <NavUser />
            </div>

            {/* Side Widgets (Weekly Goal, Pending Tasks, Quick Navigation) */}
            <DashboardStickyWidget progress={activeCourse} />
          </aside>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
