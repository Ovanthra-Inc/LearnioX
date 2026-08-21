"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  MessagesSquare,
  Sparkles,
  Award,
  Download,
  Share2,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Flame,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface EnrolledCourse {
  id: string
  courseId: string
  title: string
  slug: string
  subtitle: string
  institutionName: string
  level: string
  thumbnailTheme: {
    bg: string
    border: string
    iconColor: string
    accent: string
  }
  totalModules: number
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  lastAccessedLesson: string
  lastAccessedAt: string
  status: "IN_PROGRESS" | "COMPLETED"
  certificateId?: string
  certificateIssuedAt?: string
  communityChannelId: string
}

const REGISTERED_COURSES: EnrolledCourse[] = [
  {
    id: "enr-1",
    courseId: "c1",
    title: "Full-Stack Web Development & Microservices Mastery",
    slug: "full-stack-microservices",
    subtitle: "Next.js 14, Python FastAPI, PostgreSQL 16, Redis and Docker multi-tenant architectures.",
    institutionName: "Ovanthra Institute of Technology",
    level: "INTERMEDIATE",
    thumbnailTheme: {
      bg: "from-blue-600/20 via-indigo-600/20 to-purple-600/20",
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      accent: "bg-indigo-500/10 text-indigo-400",
    },
    totalModules: 8,
    totalLessons: 32,
    completedLessons: 22,
    progressPercentage: 68,
    lastAccessedLesson: "Module 4: Docker Compose & Ingress Routing",
    lastAccessedAt: "2 hours ago",
    status: "IN_PROGRESS",
    communityChannelId: "comm-fullstack",
  },
  {
    id: "enr-2",
    courseId: "c2",
    title: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)",
    slug: "applied-ai-llm-rag",
    subtitle: "Enterprise vectors, pgvector, LangChain pipelines, fine-tuning and agentic AI systems.",
    institutionName: "Ovanthra Institute of Technology",
    level: "ADVANCED",
    thumbnailTheme: {
      bg: "from-purple-600/20 via-fuchsia-600/20 to-pink-600/20",
      border: "border-fuchsia-500/30",
      iconColor: "text-fuchsia-400",
      accent: "bg-fuchsia-500/10 text-fuchsia-400",
    },
    totalModules: 6,
    totalLessons: 24,
    completedLessons: 9,
    progressPercentage: 38,
    lastAccessedLesson: "Module 2: Chunking Strategies & Vector Distance Metrics",
    lastAccessedAt: "Yesterday",
    status: "IN_PROGRESS",
    communityChannelId: "comm-ai-rag",
  },
  {
    id: "enr-3",
    courseId: "c3",
    title: "Distributed Systems & Cloud DevOps Engineering",
    slug: "distributed-systems-devops",
    subtitle: "Kubernetes orchestration, automated CI/CD pipelines, Nginx ingress proxy and observability.",
    institutionName: "Global Cloud Engineering Academy",
    level: "ALL LEVELS",
    thumbnailTheme: {
      bg: "from-emerald-600/20 via-teal-600/20 to-cyan-600/20",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      accent: "bg-emerald-500/10 text-emerald-400",
    },
    totalModules: 7,
    totalLessons: 28,
    completedLessons: 28,
    progressPercentage: 100,
    lastAccessedLesson: "Module 7: Capstone Cluster Deployment & Blue-Green Rollouts",
    lastAccessedAt: "Aug 15, 2026",
    status: "COMPLETED",
    certificateId: "LX-CERT-2026-98214",
    certificateIssuedAt: "August 15, 2026",
    communityChannelId: "comm-dist-sys",
  },
  {
    id: "enr-4",
    courseId: "c4",
    title: "High Performance Database Design & Indexing",
    slug: "high-performance-database-design",
    subtitle: "PostgreSQL 16 tuning, async SQLAlchemy sessions, connection pooling and execution query plans.",
    institutionName: "Global Cloud Engineering Academy",
    level: "INTERMEDIATE",
    thumbnailTheme: {
      bg: "from-amber-600/20 via-orange-600/20 to-rose-600/20",
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
      accent: "bg-amber-500/10 text-amber-400",
    },
    totalModules: 5,
    totalLessons: 18,
    completedLessons: 18,
    progressPercentage: 100,
    lastAccessedLesson: "Module 5: B-Tree vs BRIN Indexing Benchmarks",
    lastAccessedAt: "Aug 10, 2026",
    status: "COMPLETED",
    certificateId: "LX-CERT-2026-77312",
    certificateIssuedAt: "August 10, 2026",
    communityChannelId: "comm-fullstack",
  },
]

export default function RegisteredPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED" | "CERTIFICATES">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCertificate, setSelectedCertificate] = useState<EnrolledCourse | null>(null)

  // Metrics calculation
  const totalCourses = REGISTERED_COURSES.length
  const inProgressCount = REGISTERED_COURSES.filter((c) => c.status === "IN_PROGRESS").length
  const completedCount = REGISTERED_COURSES.filter((c) => c.status === "COMPLETED").length
  const totalHoursLearned = 38.5
  const streakDays = 7

  // Filter courses
  const filteredCourses = useMemo(() => {
    return REGISTERED_COURSES.filter((course) => {
      // Tab filter
      if (activeTab === "IN_PROGRESS" && course.status !== "IN_PROGRESS") return false
      if (activeTab === "COMPLETED" && course.status !== "COMPLETED") return false
      if (activeTab === "CERTIFICATES" && !course.certificateId) return false

      // Search matching
      const q = searchQuery.toLowerCase().trim()
      if (
        q &&
        !course.title.toLowerCase().includes(q) &&
        !course.subtitle.toLowerCase().includes(q) &&
        !course.institutionName.toLowerCase().includes(q)
      ) {
        return false
      }

      return true
    })
  }, [activeTab, searchQuery])

  const handleCopyCertificateLink = (certId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`https://verify.learniox.com/cert/${certId}`)
      toast.success("Certificate verification URL copied to clipboard!")
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        
        {/* Floating User Avatar */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 space-y-8">
          
          {/* 1. HERO HEADER */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <GraduationCap className="size-4" />
              <span>Student Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
              Registered Courses & Learning Tracks
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Track your enrolled institution curricula, resume lecture progress, join community channels, and view earned certifications.
            </p>
          </section>

          {/* 2. STATS & PROGRESS METRICS BENTO */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Metric 1: Total Enrolled */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Registered</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                {totalCourses}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {inProgressCount} in active progress
              </p>
            </div>

            {/* Metric 2: Completed Certifications */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Certifications</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Award className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                {completedCount}
              </div>
              <p className="text-[11px] text-emerald-500 font-medium">
                Verified & Cryptographically Signed
              </p>
            </div>

            {/* Metric 3: Total Learning Hours */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Hours Learned</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                {totalHoursLearned}h
              </div>
              <p className="text-[11px] text-muted-foreground">
                Interactive video & code sandboxes
              </p>
            </div>

            {/* Metric 4: Learning Streak */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Current Streak</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Flame className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-sans flex items-center gap-1.5">
                <span>{streakDays} Days</span>
              </div>
              <p className="text-[11px] text-amber-500 font-medium">
                Keep learning today to maintain streak!
              </p>
            </div>

          </section>

          {/* 3. FILTER TABS & SEARCH BAR */}
          <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border/60 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "ALL", label: "All Registered", count: totalCourses },
                  { id: "IN_PROGRESS", label: "In Progress", count: inProgressCount },
                  { id: "COMPLETED", label: "Completed", count: completedCount },
                  { id: "CERTIFICATES", label: "Certificates", count: completedCount },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-background text-foreground shadow-xs scale-102"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-72 rounded-xl border border-border/80 bg-card px-3 py-1.5 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="size-3.5 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered tracks..."
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

          </section>

          {/* 4. REGISTERED COURSES LIST */}
          <section className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
                <BookOpen className="mx-auto size-9 text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">
                  No registered courses in this category
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Explore verified curricula across universe and start learning today.
                </p>
                <div className="pt-1">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Discover New Courses</span>
                  </Link>
                </div>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group relative flex flex-col md:flex-row items-stretch rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md gap-5"
                >
                  {/* Left: Thumbnail with Level & Status Tag */}
                  <div
                    className={cn(
                      "relative flex aspect-video md:aspect-4/3 w-full md:w-56 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br overflow-hidden shadow-inner transition-transform group-hover:scale-[1.02]",
                      course.thumbnailTheme.bg,
                      course.thumbnailTheme.border
                    )}
                  >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                    
                    <div className="relative flex flex-col items-center justify-center text-center p-3 z-10">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-background/80 shadow-xs backdrop-blur-xs mb-1.5">
                        <BookOpen className={cn("size-5", course.thumbnailTheme.iconColor)} />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-foreground/80 font-mono">
                        {course.level}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {course.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 text-white px-2 py-0.5 text-[9px] font-bold backdrop-blur-xs shadow-xs">
                          <CheckCircle2 className="size-2.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 text-primary-foreground px-2 py-0.5 text-[9px] font-bold backdrop-blur-xs shadow-xs">
                          <Clock className="size-2.5" />
                          <span>{course.progressPercentage}% Done</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Course Details, Progress Bar & Actions */}
                  <div className="flex flex-1 flex-col justify-between min-w-0 space-y-4">
                    
                    {/* Header: Title + Subtitle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {course.institutionName}
                        </span>
                      </div>
                      
                      <Link
                        href={`/courses/${course.courseId}`}
                        className="text-base sm:text-lg font-bold tracking-tight text-foreground font-sans group-hover:text-primary transition-colors line-clamp-1"
                      >
                        {course.title}
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>
                    </div>

                    {/* Progress Bar & Current Lesson */}
                    <div className="space-y-2 rounded-xl bg-secondary/50 border border-border/60 p-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground flex items-center gap-1.5">
                          <Play className="size-3 text-primary fill-primary/30" />
                          <span className="line-clamp-1">{course.lastAccessedLesson}</span>
                        </span>
                        <span className="text-primary font-bold shrink-0 ml-2">
                          {course.completedLessons} / {course.totalLessons} Lessons
                        </span>
                      </div>

                      {/* Progress Bar Track */}
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden border border-border/40">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            course.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : "bg-primary"
                          )}
                          style={{ width: `${course.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Last active {course.lastAccessedAt}
                      </span>

                      <div className="flex items-center gap-2">
                        
                        {/* Certificate Button if Completed */}
                        {course.certificateId && (
                          <button
                            type="button"
                            onClick={() => setSelectedCertificate(course)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          >
                            <Award className="size-3.5" />
                            <span>View Certificate</span>
                          </button>
                        )}

                        {/* Community Connect Button */}
                        <Link
                          href={`/community?channel=${course.communityChannelId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <MessagesSquare className="size-3.5" />
                          <span>Community Connect</span>
                        </Link>

                        {/* Resume / Continue Learning */}
                        <Link
                          href={`/courses/${course.courseId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                        >
                          <span>{course.status === "COMPLETED" ? "Review Course" : "Continue Learning"}</span>
                          <ArrowUpRight className="size-3.5" />
                        </Link>

                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </section>

        </div>

        {/* ========================================================================= */}
        {/* CERTIFICATE VIEWER MODAL                                                  */}
        {/* ========================================================================= */}
        {selectedCertificate && (
          <Dialog open={Boolean(selectedCertificate)} onOpenChange={() => setSelectedCertificate(null)}>
            <DialogContent className="sm:max-w-2xl bg-card border-border/80 p-0 overflow-hidden">
              
              {/* Certificate Template Header */}
              <div className="p-6 sm:p-8 bg-linear-to-b from-primary/15 via-background to-background text-center space-y-4 border-b border-border/60">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
                    <Sparkles className="size-5" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-foreground font-sans">
                    Learnio<span className="text-primary">X</span> Verified Certificate
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                    Official Certificate of Completion
                  </p>
                  <p className="text-sm text-foreground/80">This is to certify that</p>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground font-sans tracking-tight">
                    Developer Student (You)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    has successfully completed the comprehensive curriculum and assessments for
                  </p>
                  <h4 className="text-base sm:text-lg font-bold text-primary font-sans">
                    {selectedCertificate.title}
                  </h4>
                </div>

                {/* Certificate Verification Badge */}
                <div className="rounded-xl border border-border/80 bg-background/80 p-3 max-w-md mx-auto flex items-center justify-between text-xs">
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      Certificate ID: {selectedCertificate.certificateId}
                    </span>
                    <span className="text-[11px] text-foreground font-semibold">
                      Issued: {selectedCertificate.certificateIssuedAt}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                    <CheckCircle2 className="size-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Certificate Footer Actions */}
              <div className="p-4 sm:p-5 bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyCertificateLink(selectedCertificate.certificateId || "")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Share2 className="size-3.5 text-primary" />
                  <span>Copy Verification URL</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Certificate PDF generated and downloaded!")
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>Download PDF Certificate</span>
                  </button>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        )}

      </SidebarInset>
    </SidebarProvider>
  )
}
