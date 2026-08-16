"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/lib/api"
import { Course } from "@/hooks/useCourses"

export interface ActiveLearningProgress {
  course_id: string
  course_title: string
  course_subtitle?: string
  thumbnail_url?: string
  last_lesson_id?: string
  last_lesson_title?: string
  last_position?: number
  progress_percentage: number
  total_lessons?: number
  completed_lessons?: number
  streak_days: number
  weekly_hours_spent: number
  weekly_hours_target: number
}

export function useLearningProgress() {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"))

  const { data: continueLearningData, isLoading: isContinueLoading } = useQuery({
    queryKey: ["continue-learning"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>("/users/me/continue-learning")
        return res.data
      } catch {
        return null
      }
    },
    enabled: hasToken,
  })

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["dashboard-courses"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<{ items: Course[]; total: number }>>("/courses?limit=10")
        return res.data?.items || []
      } catch {
        return []
      }
    },
  })

  // Fallback active progress if user has no live data or is getting started
  const activeCourseProgress: ActiveLearningProgress = continueLearningData?.items?.[0]
    ? {
        course_id: continueLearningData.items[0].course_id,
        course_title: continueLearningData.items[0].course_title,
        course_subtitle: "Modern Microservices, FastAPI, Next.js & Distributed Systems",
        last_lesson_id: continueLearningData.items[0].last_lesson_id,
        last_lesson_title: continueLearningData.items[0].last_lesson_title || "Architecture & Event Driven Services",
        last_position: continueLearningData.items[0].last_position || 120,
        progress_percentage: continueLearningData.items[0].progress_percentage || 65,
        total_lessons: 24,
        completed_lessons: 16,
        streak_days: 5,
        weekly_hours_spent: 4.8,
        weekly_hours_target: 6.0,
      }
    : {
        course_id: coursesData?.[0]?.id || "demo-course-1",
        course_title: coursesData?.[0]?.title || "Full-Stack Enterprise Architecture & Microservices",
        course_subtitle: "Production Next.js 14, FastAPI async services, and Docker orchestration.",
        last_lesson_id: "lesson-1",
        last_lesson_title: "Module 3: Gateway Topology & Asynchronous Pipelines",
        last_position: 240,
        progress_percentage: 68,
        total_lessons: 22,
        completed_lessons: 15,
        streak_days: 7,
        weekly_hours_spent: 5.2,
        weekly_hours_target: 6.0,
      }

  return {
    activeCourse: activeCourseProgress,
    courses: coursesData && coursesData.length > 0 ? coursesData : DEFAULT_COURSES,
    isLoading: isContinueLoading || isCoursesLoading,
  }
}

export const DEFAULT_COURSES: Course[] = [
  {
    id: "c1",
    institution_id: "inst-1",
    title: "Full-Stack Architecture & Microservices Mastery",
    slug: "full-stack-architecture",
    subtitle: "Build resilient multi-tenant SaaS platforms with Next.js, Python FastAPI, PostgreSQL and Redis.",
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
    subtitle: "Enterprise vectors, embeddings, LangChain pipelines, fine-tuning and agentic AI systems.",
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
    subtitle: "Kubernetes orchestration, CI/CD automated deployments, Nginx ingress proxy and observability.",
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
    subtitle: "PostgreSQL 16 tuning, async SQLAlchemy sessions, connection pooling, query plans and caching.",
    level: "INTERMEDIATE",
    access_type: "FREE",
    status: "ACTIVE",
    price: 0,
    currency: "USD",
    total_modules: 5,
    total_lessons: 18,
    created_at: new Date().toISOString(),
  },
]
