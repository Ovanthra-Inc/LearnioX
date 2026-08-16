"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useCourses, Course } from "@/hooks/useCourses"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import { CourseFeedItem } from "@/components/dashboard/course-feed-item"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Search,
  Filter,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Comprehensive course catalog data for exploration
const CATALOG_COURSES: Course[] = [
  {
    id: "c1",
    institution_id: "inst-1",
    title: "Full-Stack Web Development & Microservices Mastery",
    slug: "full-stack-microservices",
    subtitle: "Build production multi-tenant architectures with Next.js 14, Python FastAPI, PostgreSQL, Redis and Docker.",
    level: "INTERMEDIATE",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 8,
    total_lessons: 32,
    created_at: new Date().toISOString(),
  },
  {
    id: "c2",
    institution_id: "inst-1",
    title: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)",
    slug: "applied-ai-llm-rag",
    subtitle: "Master enterprise embeddings, vector databases, LangChain pipelines, fine-tuning and agentic AI systems.",
    level: "ADVANCED",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 6,
    total_lessons: 24,
    created_at: new Date().toISOString(),
  },
  {
    id: "c3",
    institution_id: "inst-2",
    title: "Distributed Systems & Cloud DevOps Engineering",
    slug: "distributed-systems-devops",
    subtitle: "Kubernetes orchestration, CI/CD automated deployment pipelines, Nginx ingress proxy, and observability.",
    level: "ALL LEVELS",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 7,
    total_lessons: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: "c4",
    institution_id: "inst-2",
    title: "High Performance Database Design & Indexing",
    slug: "high-performance-database-design",
    subtitle: "PostgreSQL 16 optimization, async SQLAlchemy 2.0 sessions, query execution plan analysis, and caching.",
    level: "INTERMEDIATE",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 5,
    total_lessons: 18,
    created_at: new Date().toISOString(),
  },
  {
    id: "c5",
    institution_id: "inst-1",
    title: "Modern React & Next.js App Router Architecture",
    slug: "modern-react-nextjs",
    subtitle: "Deep dive into Server Components, TanStack Query, Redux Toolkit, and Tailwind CSS design systems.",
    level: "BEGINNER",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 6,
    total_lessons: 26,
    created_at: new Date().toISOString(),
  },
  {
    id: "c6",
    institution_id: "inst-3",
    title: "Cybersecurity & Multi-Tenant Authorization (RBAC/ABAC)",
    slug: "cybersecurity-auth-rbac",
    subtitle: "Implement strict HttpOnly dual-cookie JWT rotation, OAuth2 SSO, Casbin authorization, and audit logging.",
    level: "ADVANCED",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 5,
    total_lessons: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: "c7",
    institution_id: "inst-3",
    title: "Data Structures & Algorithmic Problem Solving",
    slug: "data-structures-algorithms",
    subtitle: "Master graph algorithms, dynamic programming, tree traversals, and algorithmic complexity optimizations.",
    level: "INTERMEDIATE",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 8,
    total_lessons: 36,
    created_at: new Date().toISOString(),
  },
  {
    id: "c8",
    institution_id: "inst-2",
    title: "Event-Driven Microservices with Apache Kafka & Redis",
    slug: "event-driven-microservices-kafka",
    subtitle: "Stream processing, pub/sub topologies, consumer group scalability, and message idempotency.",
    level: "ADVANCED",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 6,
    total_lessons: 22,
    created_at: new Date().toISOString(),
  },
]

const CATEGORIES = [
  { id: "all", label: "All Categories", count: 8 },
  { id: "ai", label: "Artificial Intelligence & ML", count: 2 },
  { id: "web", label: "Full-Stack Development", count: 2 },
  { id: "cloud", label: "Cloud & DevOps", count: 2 },
  { id: "db", label: "Database Systems", count: 1 },
  { id: "security", label: "Security & Authorization", count: 1 },
]

const LEVELS = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"]

const ITEMS_PER_PAGE = 4

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // API courses query with fallback to rich catalog
  const { courses: apiCourses, isLoading } = useCourses({
    search: searchQuery,
  })

  const allCourses = useMemo(() => {
    return apiCourses && apiCourses.length > 0 ? apiCourses : CATALOG_COURSES
  }, [apiCourses])

  // Filter courses by search, category, and level
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      // Search matching
      const matchesSearch =
        searchQuery.trim() === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())

      // Level matching
      const matchesLevel =
        selectedLevel === "ALL" ||
        course.level?.toUpperCase() === selectedLevel ||
        course.level === "ALL LEVELS"

      // Category matching
      let matchesCategory = true
      if (selectedCategory === "ai") {
        matchesCategory = course.title.toLowerCase().includes("ai") || course.title.toLowerCase().includes("rag")
      } else if (selectedCategory === "web") {
        matchesCategory = course.title.toLowerCase().includes("full-stack") || course.title.toLowerCase().includes("react")
      } else if (selectedCategory === "cloud") {
        matchesCategory = course.title.toLowerCase().includes("cloud") || course.title.toLowerCase().includes("kafka")
      } else if (selectedCategory === "db") {
        matchesCategory = course.title.toLowerCase().includes("database")
      } else if (selectedCategory === "security") {
        matchesCategory = course.title.toLowerCase().includes("security") || course.title.toLowerCase().includes("auth")
      }

      return matchesSearch && matchesLevel && matchesCategory
    })
  }, [allCourses, searchQuery, selectedCategory, selectedLevel])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE))
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredCourses, currentPage])

  // Reset page when filters change
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId)
    setCurrentPage(1)
  }

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedLevel("ALL")
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || selectedLevel !== "ALL"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        {/* Top-Right Corner Floating Avatar (No Top Navbar) */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 space-y-10">
          
          {/* 1. HERO HEADER: Centered Title & Subtitle */}
          <section className="text-center space-y-2 max-w-3xl mx-auto pt-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans">
              Explore course across universe
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explore course across universe — discover verified curriculum, developer certifications, and multi-tenant tracks.
            </p>
          </section>

          {/* 2. CENTERED SEARCH BAR */}
          <section className="w-full max-w-2xl mx-auto">
            <div className="relative flex items-center w-full rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex size-9 items-center justify-center text-muted-foreground pl-2">
                <Search className="size-4.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search courses, topics, tech stacks, or keywords..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mr-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </section>

          {/* 3. MAIN SPLIT SECTION: Left Filter Panel + Right Course Cards List */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Filter Section */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-6 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground font-sans">Filter section</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 font-sans">
                  Categories
                </span>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px]",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {cat.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 font-sans">
                  Difficulty Level
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map((lvl) => {
                    const isSelected = selectedLevel === lvl
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleLevelChange(lvl)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        {lvl === "ALL" ? "All Levels" : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            {/* RIGHT: Course Cards List (Vertical stack) */}
            <main className="lg:col-span-8 xl:col-span-9 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>
                  Showing <strong>{filteredCourses.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}</strong> of <strong>{filteredCourses.length}</strong> courses
                </span>
                <span className="hidden sm:inline">
                  Verified Institution Curricula
                </span>
              </div>

              {/* Course Items List */}
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-36 rounded-xl border border-border bg-card animate-pulse"
                  />
                ))
              ) : filteredCourses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
                  <BookOpen className="mx-auto size-8 text-muted-foreground/60" />
                  <h3 className="text-sm font-bold text-foreground">No courses match your filter</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try clearing your search query or selecting a different category.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedCourses.map((course, idx) => (
                    <CourseFeedItem
                      key={course.id}
                      course={course}
                      index={(currentPage - 1) * ITEMS_PER_PAGE + idx}
                    />
                  ))}
                </div>
              )}

              {/* 4. BOTTOM PAGINATION BAR */}
              {filteredCourses.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border/60">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-xs hover:bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </button>

                  {/* Numbered Page Buttons */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1
                      const isCurrent = pageNum === currentPage
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "size-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            isCurrent
                              ? "bg-primary text-primary-foreground shadow-xs scale-105"
                              : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-xs hover:bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              )}

            </main>

          </section>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
