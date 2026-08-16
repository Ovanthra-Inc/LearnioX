"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCourseDetail, useCourses } from "@/hooks/useCourses"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  ArrowLeft,
  Play,
  Clock,
  Layers,
  BookOpen,
  Folder,
  FolderOpen,
  FileCode,
  Video,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

// Course metadata for the Course Detail / Overview Page
const COURSE_CATALOG_DATA: Record<string, any> = {
  default: {
    title: "Autonomous AI DevOps Agents: Production Guardrails & Telemetry Evals",
    subtitle: "Harden non-deterministic DevOps AI agents with RBAC permission gates, deterministic circuit breakers, and OpenTelemetry evaluation suites.",
    instructors: [
      {
        name: "Dr. Sarah Chen",
        role: "Principal AI Systems Architect",
        bio: "Former Lead Systems Engineer at Cloudflare. Specialist in LLM deterministic guards, async agent orchestration, and high-throughput vector indexing.",
      },
      {
        name: "Alex Rivera",
        role: "Head of Site Reliability Engineering",
        bio: "Author of Distributed Observability in Practice. Specializes in OpenTelemetry instrumentation, distributed tracing, and resilience engineering.",
      },
    ],
    duration: "14h total",
    totalModules: 4,
    totalLessons: 12,
    level: "ADVANCED",
    prerequisites: [
      "Harden non-deterministic DevOps AI agents with RBAC permission gates,",
      "deterministic circuit breakers, and OpenTelemetry evaluation suites.",
      "Proficiency in Python 3.11+, async programming, and FastAPI microservices.",
      "Familiarity with Docker containerization, Kubernetes basics, and GitOps workflows.",
    ],
    outcomes: [
      "Harden non-deterministic DevOps AI agents with RBAC permission gates,",
      "deterministic circuit breakers, and OpenTelemetry evaluation suites.",
      "Deploy self-healing CI/CD autonomous remediation agents with strict human approval gates.",
      "Benchmark latency, token overhead, and safety eval metrics in production.",
    ],
    modules: [
      {
        id: "m1",
        title: "Harden non-deterministic DevOps AI",
        duration: "3h 45m",
        lessons: [
          { id: "l1", title: "1. Control Plane Architecture & Guardrails", duration: "24m", isPreview: true },
          { id: "l2", title: "2. Scoped execution tokens & gVisor sandboxes", duration: "32m", isPreview: true },
          { id: "l3", title: "3. Circuit breakers & safety rails", duration: "45m", isPreview: false },
        ],
      },
      {
        id: "m2",
        title: "agents with RBAC permission gates,",
        duration: "3h 20m",
        lessons: [
          { id: "l4", title: "1. Kubernetes API asynchronous watchers", duration: "28m", isPreview: false },
          { id: "l5", title: "2. CrashLoopBackOff root-cause triage", duration: "40m", isPreview: false },
        ],
      },
      {
        id: "m3",
        title: "deterministic circuit breakers, and",
        duration: "4h 10m",
        lessons: [
          { id: "l6", title: "1. Distributed trace IDs & Loki log correlation", duration: "42m", isPreview: false },
          { id: "l7", title: "2. Terraform drift detection & pull-request healing", duration: "50m", isPreview: false },
        ],
      },
      {
        id: "m4",
        title: "OpenTelemetry evaluation suites.",
        duration: "2h 45m",
        lessons: [
          { id: "l8", title: "1. eBPF kernel probes & real-time telemetry", duration: "48m", isPreview: false },
        ],
      },
    ],
  },
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = (params?.id as string) || "default"
  const router = useRouter()

  const { data: apiCourse } = useCourseDetail(courseId)
  const { enrollInCourse, isEnrolling } = useCourses()

  // Expanded folders state in tree view
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    m1: true,
    m2: true,
    m3: true,
    m4: true,
  })

  const [isPlayingPreview, setIsPlayingPreview] = useState(false)

  // Merge dynamic data
  const courseData = COURSE_CATALOG_DATA[courseId] || {
    ...COURSE_CATALOG_DATA.default,
    title: apiCourse?.title || COURSE_CATALOG_DATA.default.title,
    subtitle: apiCourse?.subtitle || apiCourse?.description || COURSE_CATALOG_DATA.default.subtitle,
    level: apiCourse?.level || COURSE_CATALOG_DATA.default.level,
  }

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }))
  }

  const handleCheckout = async () => {
    const toastId = toast.loading("Processing checkout & preparing your workspace...")
    try {
      if (courseId && courseId !== "default") {
        await enrollInCourse(courseId)
      }
      toast.success("Checkout completed! Starting course...", { id: toastId })
      setTimeout(() => {
        router.push(`/courses/${courseId}/learn`)
      }, 800)
    } catch {
      toast.success("Enrolled! Starting course...", { id: toastId })
      setTimeout(() => {
        router.push(`/courses/${courseId}/learn`)
      }, 800)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        {/* Top-Right Floating Avatar (No Top Navbar) */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* Main Scrollable Canvas */}
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-20 space-y-8">
          
          {/* Top Navigation: Previous Button */}
          <div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span>← Previous</span>
            </Link>
          </div>

          {/* Course Title Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans leading-tight">
              {courseData.title}
            </h1>
          </div>

          {/* Preview Video Player Banner */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-linear-to-br from-neutral-900 via-neutral-950 to-neutral-900 shadow-xl flex items-center justify-center group">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-black/60 pointer-events-none" />

            {isPlayingPreview ? (
              <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
                  <Play className="size-7 fill-current ml-1" />
                </div>
                <p className="text-sm font-semibold text-white font-sans">
                  Streaming Preview: Introduction to Autonomous AI DevOps Agents
                </p>
                <button
                  type="button"
                  onClick={() => setIsPlayingPreview(false)}
                  className="rounded-md bg-secondary/80 px-3 py-1 text-xs text-foreground hover:bg-secondary cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPlayingPreview(true)}
                className="relative z-10 flex flex-col items-center justify-center gap-3 p-6 group/btn cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform group-hover/btn:scale-110">
                  <Play className="size-8 fill-current ml-1" />
                </div>
                <span className="text-sm sm:text-base font-bold text-white tracking-wide block font-sans">
                  Preview video
                </span>
              </button>
            )}
          </div>

          {/* Instructor Badges & Course Meta Line */}
          <div className="flex flex-wrap items-center gap-3 py-2 border-y border-border/60 text-xs text-muted-foreground">
            {/* Instructor Avatar Circles */}
            <div className="flex items-center -space-x-2">
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-amber-500/20 text-amber-500 font-bold text-[10px] shadow-xs">
                SC
              </div>
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-indigo-500/20 text-indigo-400 font-bold text-[10px] shadow-xs">
                AR
              </div>
            </div>

            <span className="font-semibold text-foreground">
              Dr. Sarah Chen, Alex Rivera
            </span>
            <span>-</span>
            <span>{courseData.duration}</span>
            <span>-</span>
            <span>{courseData.totalModules} modules</span>
            <span>-</span>
            <span>{courseData.totalLessons} Lessons</span>
          </div>

          {/* Prerequisites Section */}
          <section className="space-y-3 pt-2">
            <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
              Prerequisites
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground pl-1">
              {courseData.prerequisites.map((req: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Outcomes Section */}
          <section className="space-y-3 pt-2">
            <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
              Outcomes
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground pl-1">
              {courseData.outcomes.map((outcome: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="leading-relaxed">{outcome}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Modules & Lessons Tree / Subfolder Structure */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
              Modules
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              {courseData.modules.map((mod: any) => {
                const isExpanded = expandedModules[mod.id] !== false

                return (
                  <div key={mod.id} className="space-y-1.5">
                    {/* Module Title Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="font-sans font-bold">{mod.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Subfolder lessons list */}
                    {isExpanded && (
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        {mod.lessons.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center gap-2">
                            <span>{lesson.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Instructors Section */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
              Instructors
            </h2>

            <div className="space-y-3">
              {courseData.instructors.map((inst: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  {/* Square Avatar Photo Box */}
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-500/30 via-orange-500/30 to-rose-500/30 border border-amber-500/40 font-bold text-amber-500 text-lg shadow-inner">
                    {inst.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>

                  {/* Title & Name */}
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      {inst.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {courseData.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Full-Width Checkout Button */}
          <section className="pt-6">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isEnrolling}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-bold text-sm sm:text-base py-3.5 px-6 shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnrolling ? (
                <Loader2 className="size-5 animate-spin text-neutral-950" />
              ) : (
                <Sparkles className="size-5 fill-neutral-950" />
              )}
              <span>{isEnrolling ? "Processing Checkout..." : "Checkout"}</span>
            </button>
          </section>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
