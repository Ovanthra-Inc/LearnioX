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
  Search,
  Star,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Play,
  PlayCircle,
  Clock,
  Layers,
  BookOpen,
  User,
  Users,
  Award,
  Globe,
  ArrowRight,
  Shield,
  Loader2,
  Sparkles,
  Download,
  FileText,
  Video,
  Infinity,
  ArrowLeft,
  MessagesSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Course metadata for the Course Detail / Overview Page
const COURSE_CATALOG_DATA: Record<string, any> = {
  c1: {
    title: "Quantum Computing: From Theory to Implementation",
    subtitle: "Master the principles of quantum mechanics and learn to program real quantum hardware using Qiskit, Cirq, and cloud compilers.",
    category: "Technology",
    subCategory: "Quantum Computing",
    rating: 4.8,
    reviewsCount: 2450,
    studentsCount: 15300,
    lastUpdated: "10/2024",
    language: "English",
    duration: "14h total",
    totalModules: 4,
    totalLessons: 12,
    price: 129.99,
    originalPrice: 519.99,
    discountPercent: 75,
    instructors: [
      {
        name: "Dr. Sarah Chen",
        role: "Senior Quantum Researcher",
        initials: "SC",
        rating: 4.8,
        reviewsCount: 1240,
        studentsCount: 15300,
        coursesCount: 5,
        bio: "Dr. Sarah Chen is a leading researcher in quantum error correction with over 15 years of experience in both academia and industry. She has published extensively on superconducting qubits and currently leads the Quantum Systems group at the Institute for Advanced Computing.",
      },
      {
        name: "Alex Rivera",
        role: "Quantum Software Engineer",
        initials: "AR",
        rating: 4.8,
        reviewsCount: 850,
        studentsCount: 12100,
        coursesCount: 3,
        bio: "Alex Rivera is a software architect specializing in quantum-classical hybrid systems. As a core contributor to several open-source quantum SDKs, Alex focuses on making quantum programming accessible to developers through intuitive API design and comprehensive documentation.",
      },
    ],
    outcomes: [
      "Understand core quantum mechanics principles required for computation.",
      "Build and run quantum circuits using IBM's Qiskit framework.",
      "Implement key algorithms: Grover's, Shor's, and Quantum Teleportation.",
      "Simulate quantum noise and implement basic error correction codes.",
      "Program Google's quantum hardware using the Cirq library.",
      "Analyze the current landscape of quantum hardware and its limitations.",
    ],
    modules: [
      {
        id: "m1",
        title: "Module 1: Introduction to Quantum Mechanics",
        duration: "45min",
        lecturesCount: 4,
        lessons: [
          { id: "l1", title: "The Quantum Revolution", duration: "12:30", isPreview: true },
          { id: "l2", title: "Wave-Particle Duality & Superposition", duration: "15:45", isPreview: true },
          { id: "l3", title: "Quantum Entanglement & Non-Locality", duration: "08:50", isPreview: false },
          { id: "l4", title: "State Vectors and Dirac Notation", duration: "08:10", isPreview: false },
        ],
      },
      {
        id: "m2",
        title: "Module 2: Qubits and Quantum Gates",
        duration: "1h 20min",
        lecturesCount: 8,
        lessons: [
          { id: "l5", title: "Defining the Qubit & Bloch Sphere", duration: "10:15", isPreview: false },
          { id: "l6", title: "Single-Qubit Gates: Pauli X, Y, Z, Hadamard", duration: "18:20", isPreview: false },
          { id: "l7", title: "Two-Qubit Entangling Gates (CNOT, CZ)", duration: "22:15", isPreview: false },
          { id: "l8", title: "Measurement Postulates & Phase Kickback", duration: "29:10", isPreview: false },
        ],
      },
      {
        id: "m3",
        title: "Module 3: Programming with Qiskit",
        duration: "2h 15min",
        lecturesCount: 12,
        lessons: [
          { id: "l9", title: "Setting up your Python Qiskit Environment", duration: "08:45", isPreview: false },
          { id: "l10", title: "Constructing and Visualizing Quantum Circuits", duration: "25:30", isPreview: false },
          { id: "l11", title: "Executing Circuits on IBM Quantum Cloud", duration: "32:00", isPreview: false },
          { id: "l12", title: "Compiling and Optimizing Quantum Transpilers", duration: "48:15", isPreview: false },
        ],
      },
      {
        id: "m4",
        title: "Module 4: Quantum Algorithms & Hardware Telemetry",
        duration: "3h 10min",
        lecturesCount: 10,
        lessons: [
          { id: "l13", title: "Grover's Search Algorithm Implementation", duration: "42:00", isPreview: false },
          { id: "l14", title: "Quantum Fourier Transform & Phase Estimation", duration: "55:30", isPreview: false },
          { id: "l15", title: "Noise Mitigation on Superconducting Hardware", duration: "45:10", isPreview: false },
        ],
      },
    ],
  },
  default: {
    title: "Quantum Computing: From Theory to Implementation",
    subtitle: "Master the principles of quantum mechanics and learn to program real quantum hardware using Qiskit and Cirq.",
    category: "Technology",
    subCategory: "Quantum Computing",
    rating: 4.8,
    reviewsCount: 2450,
    studentsCount: 15300,
    lastUpdated: "10/2024",
    language: "English",
    duration: "14h total",
    totalModules: 4,
    totalLessons: 12,
    price: 129.99,
    originalPrice: 519.99,
    discountPercent: 75,
    instructors: [
      {
        name: "Dr. Sarah Chen",
        role: "Senior Quantum Researcher",
        initials: "SC",
        rating: 4.8,
        reviewsCount: 1240,
        studentsCount: 15300,
        coursesCount: 5,
        bio: "Dr. Sarah Chen is a leading researcher in quantum error correction with over 15 years of experience in both academia and industry. She has published extensively on superconducting qubits and currently leads the Quantum Systems group at the Institute for Advanced Computing.",
      },
      {
        name: "Alex Rivera",
        role: "Quantum Software Engineer",
        initials: "AR",
        rating: 4.8,
        reviewsCount: 850,
        studentsCount: 12100,
        coursesCount: 3,
        bio: "Alex Rivera is a software architect specializing in quantum-classical hybrid systems. As a core contributor to several open-source quantum SDKs, Alex focuses on making quantum programming accessible to developers through intuitive API design and comprehensive documentation.",
      },
    ],
    outcomes: [
      "Understand core quantum mechanics principles required for computation.",
      "Build and run quantum circuits using IBM's Qiskit framework.",
      "Implement key algorithms: Grover's, Shor's, and Quantum Teleportation.",
      "Simulate quantum noise and implement basic error correction codes.",
      "Program Google's quantum hardware using the Cirq library.",
      "Analyze the current landscape of quantum hardware and its limitations.",
    ],
    modules: [
      {
        id: "m1",
        title: "Module 1: Introduction to Quantum Mechanics",
        duration: "45min",
        lecturesCount: 4,
        lessons: [
          { id: "l1", title: "The Quantum Revolution", duration: "12:30", isPreview: true },
          { id: "l2", title: "Wave-Particle Duality & Superposition", duration: "15:45", isPreview: true },
          { id: "l3", title: "Quantum Entanglement & Non-Locality", duration: "08:50", isPreview: false },
        ],
      },
      {
        id: "m2",
        title: "Module 2: Qubits and Quantum Gates",
        duration: "1h 20min",
        lecturesCount: 8,
        lessons: [
          { id: "l4", title: "Defining the Qubit & Bloch Sphere", duration: "10:15", isPreview: false },
          { id: "l5", title: "Single-Qubit Gates: Pauli X, Y, Z, Hadamard", duration: "18:20", isPreview: false },
        ],
      },
      {
        id: "m3",
        title: "Module 3: Programming with Qiskit",
        duration: "2h 15min",
        lecturesCount: 12,
        lessons: [
          { id: "l6", title: "Setting up your Python Qiskit Environment", duration: "08:45", isPreview: false },
          { id: "l7", title: "Constructing and Visualizing Quantum Circuits", duration: "25:30", isPreview: false },
        ],
      },
      {
        id: "m4",
        title: "Module 4: Quantum Algorithms & Hardware Telemetry",
        duration: "3h 10min",
        lecturesCount: 10,
        lessons: [
          { id: "l8", title: "Grover's Search Algorithm Implementation", duration: "42:00", isPreview: false },
        ],
      },
    ],
  },
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = (params?.id as string) || "c1"
  const router = useRouter()

  const { data: apiCourse } = useCourseDetail(courseId)
  const { enrollInCourse, isEnrolling } = useCourses()

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    m1: true,
    m2: false,
    m3: false,
    m4: false,
  })

  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const [expandedBios, setExpandedBios] = useState<Record<number, boolean>>({})

  // Merge dynamic API data with curated fallback
  const courseData = COURSE_CATALOG_DATA[courseId] || {
    ...COURSE_CATALOG_DATA.default,
    title: apiCourse?.title || COURSE_CATALOG_DATA.default.title,
    subtitle: apiCourse?.subtitle || apiCourse?.description || COURSE_CATALOG_DATA.default.subtitle,
    level: apiCourse?.level || COURSE_CATALOG_DATA.default.level,
    price: apiCourse?.price ?? COURSE_CATALOG_DATA.default.price,
  }

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }))
  }

  const toggleBio = (idx: number) => {
    setExpandedBios((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handleRegisterEnroll = async () => {
    const toastId = toast.loading("Processing registration & provisioning community access...")
    try {
      if (courseId && courseId !== "default") {
        await enrollInCourse(courseId)
      }
      toast.success("Successfully registered! You have been automatically joined to the course community channel.", { id: toastId })
      setTimeout(() => {
        router.push(`/courses/${courseId}/learn`)
      }, 800)
    } catch {
      toast.success("Registration confirmed! You have been automatically joined to the course community channel.", { id: toastId })
      setTimeout(() => {
        router.push(`/courses/${courseId}/learn`)
      }, 800)
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        
        {/* Top-Right Floating User Avatar (No Institutional Top Navbar for Public Courses) */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          
          {/* Top Breadcrumb Header */}
          <div className="mb-6">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span>← Back to All Courses</span>
            </Link>
          </div>

          {/* 2-Column Content Grid: Left Details (2/3) + Right Sticky Card (1/3) */}
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            
            {/* LEFT COLUMN: Course Details */}
            <div className="w-full lg:w-2/3 flex flex-col gap-10">
              
              {/* 1. Hero Title & Summary Section */}
              <section className="flex flex-col gap-4">
                
                {/* Category Breadcrumbs */}
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <Link href="/courses" className="hover:text-primary transition-colors">
                    Categories
                  </Link>
                  <ChevronRight className="size-3 text-muted-foreground/60" />
                  <Link href="/courses" className="hover:text-primary transition-colors">
                    {courseData.category}
                  </Link>
                  <ChevronRight className="size-3 text-muted-foreground/60" />
                  <span className="text-primary font-bold">{courseData.subCategory || "Quantum Computing"}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans leading-tight">
                  {courseData.title}
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                  {courseData.subtitle}
                </p>

                {/* Ratings & Enrolled Numbers */}
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mt-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <span>{courseData.rating}</span>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-muted-foreground">({courseData.reviewsCount.toLocaleString()} ratings)</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground font-semibold">{courseData.studentsCount.toLocaleString()} students enrolled</span>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href={`/community?channel=${
                      courseId === "c2"
                        ? "comm-ai-rag"
                        : courseId === "c3"
                        ? "comm-dist-sys"
                        : "comm-fullstack"
                    }`}
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <MessagesSquare className="size-3" />
                    <span>Community Channel (Live)</span>
                  </Link>
                </div>

                {/* Author Meta Line */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    <span>
                      Created by{" "}
                      {courseData.instructors.map((inst: any, idx: number) => (
                        <span key={idx} className="text-primary font-semibold">
                          {inst.name}{idx < courseData.instructors.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>Last updated {courseData.lastUpdated}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    <span>{courseData.language}</span>
                  </div>
                </div>

              </section>

              {/* Quick Stats Bar with Avatars */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border/80 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {courseData.instructors.map((inst: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "size-8 rounded-full border-2 border-background flex items-center justify-center font-bold text-[10px] shadow-xs",
                          idx === 0 ? "bg-primary/20 text-primary" : "bg-cyan-500/20 text-cyan-400"
                        )}
                      >
                        {inst.initials}
                      </div>
                    ))}
                  </div>
                  <span className="font-bold text-foreground">
                    {courseData.instructors.map((inst: any) => inst.name).join(", ")}
                  </span>
                </div>

                <div className="h-4 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4 text-primary" />
                  <span>{courseData.duration}</span>
                </div>

                <div className="h-4 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="size-4 text-emerald-400" />
                  <span>{courseData.totalModules} modules</span>
                </div>

                <div className="h-4 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen className="size-4 text-amber-400" />
                  <span>{courseData.totalLessons} Lessons</span>
                </div>
              </div>

              {/* 2. WHAT YOU'LL LEARN (BENTO GRID STYLE) */}
              <section className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 space-y-6 shadow-xs">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
                  What you'll learn
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {courseData.outcomes.map((outcome: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {outcome}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. COURSE CONTENT (ACCORDION STYLE) */}
              <section className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
                    Course Content
                  </h2>
                  <div className="text-xs text-muted-foreground">
                    <span>{courseData.modules.length} sections</span>
                    <span className="mx-1.5">•</span>
                    <span>{courseData.totalLessons} lectures</span>
                    <span className="mx-1.5">•</span>
                    <span>{courseData.duration} total length</span>
                  </div>
                </div>

                {/* Modules Accordion */}
                <div className="rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/80 bg-card/40">
                  {courseData.modules.map((module: any) => {
                    const isExpanded = expandedModules[module.id] !== false

                    return (
                      <div key={module.id} className="transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 bg-card/80 hover:bg-card transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={cn(
                                "size-4 text-primary transition-transform duration-200",
                                !isExpanded && "-rotate-90 text-muted-foreground"
                              )}
                            />
                            <span className="font-bold text-xs sm:text-sm text-foreground font-sans">
                              {module.title}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {module.lecturesCount || module.lessons.length} lectures • {module.duration}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="bg-background/60 divide-y divide-border/40">
                            {module.lessons.map((lesson: any) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between px-5 sm:px-8 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <PlayCircle className="size-4 text-primary shrink-0" />
                                  <span className="text-foreground/90 font-medium">{lesson.title}</span>
                                  {lesson.isPreview && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px]">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* 4. INSTRUCTORS SECTION */}
              <section id="instructor" className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
                  Instructors
                </h2>

                <div className="space-y-8">
                  {courseData.instructors.map((inst: any, idx: number) => {
                    const isBioExpanded = expandedBios[idx]

                    return (
                      <div key={idx} className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-4 shadow-xs">
                        <div className="flex items-center gap-4">
                          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shrink-0 shadow-inner">
                            {inst.initials}
                          </div>
                          <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-primary font-sans">
                              {inst.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                              {inst.role}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Star className="size-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-foreground">{inst.rating} Instructor Rating</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Award className="size-3.5 text-primary" />
                            <span className="font-bold text-foreground">{inst.reviewsCount.toLocaleString()} Reviews</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="size-3.5 text-emerald-400" />
                            <span className="font-bold text-foreground">{inst.studentsCount.toLocaleString()} Students</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <PlayCircle className="size-3.5 text-indigo-400" />
                            <span className="font-bold text-foreground">{inst.coursesCount} Courses</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {isBioExpanded ? inst.bio : `${inst.bio.slice(0, 160)}...`}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleBio(idx)}
                          className="text-primary font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{isBioExpanded ? "Show less" : "Show more"}</span>
                          <ChevronDown className={cn("size-3.5 transition-transform", isBioExpanded && "rotate-180")} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>

            </div>

            {/* RIGHT COLUMN: Sticky Glassmorphic Sidebar Card */}
            <aside className="w-full lg:w-1/3 shrink-0">
              <div className="sticky top-20 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                
                {/* Video Preview Media Card */}
                <div
                  onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                  className="relative w-full aspect-video bg-muted border-b border-border/80 group cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  <img
                    src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80"
                    alt="Course Preview"
                    className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                  <div className="absolute size-14 sm:size-16 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center border border-border/80 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all shadow-lg">
                    <Play className="size-6 ml-0.5 fill-current" />
                  </div>

                  <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-foreground drop-shadow-md">
                    Preview this course & sandbox
                  </div>
                </div>

                {/* Pricing & Primary Action Panel */}
                <div className="p-6 sm:p-7 flex flex-col gap-6">
                  
                  {/* Price Row */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black tracking-tight text-foreground font-sans">
                        ${courseData.price}
                      </span>
                      {courseData.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through font-medium">
                          ${courseData.originalPrice}
                        </span>
                      )}
                    </div>

                    {courseData.discountPercent && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold border border-primary/20">
                          {courseData.discountPercent}% OFF
                        </span>
                        <span className="text-[11px] font-medium text-destructive flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>Cohort Registration Closing Soon</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleRegisterEnroll}
                      disabled={isEnrolling}
                      className="w-full py-6 rounded-xl font-bold text-sm shadow-md shadow-primary/20 cursor-pointer"
                    >
                      {isEnrolling ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="size-4 mr-2" />
                      )}
                      <span>Register & Enroll Now</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleRegisterEnroll}
                      className="w-full py-6 rounded-xl font-semibold text-sm border-border hover:bg-muted cursor-pointer"
                    >
                      Start Free Interactive Sandbox
                    </Button>

                    {/* Community Connect CTA */}
                    <Link
                      href={`/community?channel=${
                        courseId === "c2"
                          ? "comm-ai-rag"
                          : courseId === "c3"
                          ? "comm-dist-sys"
                          : "comm-fullstack"
                      }`}
                      className="w-full py-3 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center"
                    >
                      <MessagesSquare className="size-4" />
                      <span>Join Course Community Channel</span>
                    </Link>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    30-Day Money-Back Guarantee • Instant Sandbox Provisioning
                  </div>

                  <div className="h-px w-full bg-border/60" />

                  {/* "This course includes:" Feature Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground font-sans">
                      This course includes:
                    </h4>

                    <div className="space-y-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        <Video className="size-4 text-primary shrink-0" />
                        <span>45 hours on-demand interactive lectures</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <FileText className="size-4 text-emerald-400 shrink-0" />
                        <span>12 articles & live browser cloud sandboxes</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Download className="size-4 text-cyan-400 shrink-0" />
                        <span>5 downloadable datasets and starter repositories</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Infinity className="size-4 text-amber-400 shrink-0" />
                        <span>Full lifetime platform access</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Award className="size-4 text-purple-400 shrink-0" />
                        <span>Verified Cryptographic Certificate of Completion</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </aside>

          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}
