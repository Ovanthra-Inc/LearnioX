"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  ThumbsUp,
  Code,
  Radio,
  Bookmark,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Lesson {
  id: string
  title: string
  duration: string
  readTime: string
  completed: boolean
  description?: string
  transcript?: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

const COURSE_PLAYLIST_DATA: {
  tag: string
  title: string
  subtitle: string
  modules: Module[]
} = {
  tag: "DEVOPS PLAYLIST",
  title: "Autonomous AI DevOps & Infrastructure Agents Series",
  subtitle:
    "A masterclass series on building production-grade AI agents for Kubernetes self-healing, CI/CD triage, GitOps Terraform drift remediation, and deterministic safety telemetry.",
  modules: [
    {
      id: "mod-1",
      title: "MODULE 1: AGENTIC CONTROL PLANE & K8S SELF-HEALING",
      lessons: [
        {
          id: "l-1",
          title: "Autonomous AI DevOps Agents Part 1: Control Plane Architecture & Guardrails",
          duration: "18:30",
          readTime: "4 min read",
          completed: true,
          description:
            "Architecting safe non-deterministic autonomous agents. We define strict RBAC execution boundaries, sandbox isolation layers with gVisor, and fail-safe deterministic circuit breakers.",
          transcript:
            "Welcome to Part 1 of the Autonomous AI DevOps Agents masterclass. Today, we delve into orchestrating self-healing AI agents directly on production Kubernetes clusters while keeping non-deterministic hallucinations under rigorous guardrails...",
        },
        {
          id: "l-2",
          title: "Autonomous AI DevOps Agents Part 2: Kubernetes Self-Healing Watchers",
          duration: "24:15",
          readTime: "6 min read",
          completed: false,
          description:
            "Writing asynchronous Kubernetes API watchers that ingest CrashLoopBackOff events, generate root-cause hypotheses, and execute remediation workflows.",
        },
      ],
    },
    {
      id: "mod-2",
      title: "MODULE 2: AUTOMATED TRIAGE & INFRASTRUCTURE-AS-CODE",
      lessons: [
        {
          id: "l-3",
          title: "Autonomous AI DevOps Agents Part 3: Automated Incident Triage & Log Corroboration",
          duration: "21:40",
          readTime: "5 min read",
          completed: false,
          description:
            "Correlating distributed trace IDs across vector database embeddings, Loki log clusters, and Prometheus metric anomalies to formulate diagnostic runbooks.",
        },
        {
          id: "l-4",
          title: "Autonomous AI DevOps Agents Part 4: GitOps & Terraform State Drift Remediation",
          duration: "28:10",
          readTime: "7 min read",
          completed: false,
          description:
            "Generating verified Terraform pull requests to automatically heal cloud configuration drift with automated plan validation.",
        },
      ],
    },
    {
      id: "mod-3",
      title: "MODULE 3: KERNEL TELEMETRY, FINOPS & PRODUCTION GUARDRAILS",
      lessons: [
        {
          id: "l-5",
          title: "Autonomous AI DevOps Agents Part 5: eBPF Kernel Telemetry & Real-Time Tracing",
          duration: "26:50",
          readTime: "5 min read",
          completed: false,
          description:
            "Deploying eBPF kernel probes to observe network packet latency, system call interceptions, and agentic process security bounds.",
        },
        {
          id: "l-6",
          title: "Autonomous AI DevOps Agents Part 6: FinOps Token Cost Optimization & Routing",
          duration: "19:25",
          readTime: "4 min read",
          completed: false,
          description:
            "Building multi-model cascading routers that route easy tasks to lightweight SLMs and reserve reasoning-heavy tasks for frontier LLMs.",
        },
        {
          id: "l-7",
          title: "Autonomous AI DevOps Agents Part 7: OpenTelemetry Regression Eval Suites",
          duration: "32:00",
          readTime: "8 min read",
          completed: false,
          description:
            "Building continuous CI evaluation test suites with prompt perturbation, latency baselines, and safety metric thresholds.",
        },
      ],
    },
  ],
}

export default function CourseLearningWorkspacePage() {
  const params = useParams()
  const courseId = (params?.id as string) || "default"
  const router = useRouter()

  // Active Lesson State
  const [activeLessonId, setActiveLessonId] = useState<string>("l-1")
  const [activeTab, setActiveTab] = useState<"live" | "qa" | "notes" | "discussions" | "resources">("live")

  // Video Player Controls State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState("1x")
  const [notesList, setNotesList] = useState<{ id: string; time: string; text: string }[]>([
    {
      id: "n-1",
      time: "03:45",
      text: "RBAC token scopes must be locked down to namespace level with read-only cluster role bindings.",
    },
    {
      id: "n-2",
      time: "11:20",
      text: "Circuit breaker pattern: if agent error rate > 5% over 1 minute window, halt autonomous executions.",
    },
  ])
  const [newNote, setNewNote] = useState("")

  const [questionsList, setQuestionsList] = useState<
    { id: string; author: string; question: string; votes: number; answers: number; time: string }[]
  >([
    {
      id: "q-1",
      author: "David K.",
      question: "How do we prevent agent deadlocks when two remediation actions touch the same Kubernetes pod?",
      votes: 14,
      answers: 2,
      time: "05:12",
    },
    {
      id: "q-2",
      author: "Elena Rostova",
      question: "Is gVisor recommended over standard Kata Containers for agent sandboxing in production?",
      votes: 9,
      answers: 3,
      time: "12:40",
    },
  ])
  const [newQuestion, setNewQuestion] = useState("")

  // Flattened lesson list for easy previous/next navigation
  const allLessons = useMemo(() => {
    return COURSE_PLAYLIST_DATA.modules.flatMap((mod) => mod.lessons)
  }, [])

  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId)
  const currentLesson = allLessons[currentLessonIndex] || allLessons[0]

  const completedCount = allLessons.filter((l) => l.completed).length
  const totalCount = allLessons.length

  // Navigation handlers
  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[currentLessonIndex + 1].id)
      setIsPlaying(true)
      toast.info(`Playing: ${allLessons[currentLessonIndex + 1].title.slice(0, 45)}...`)
    }
  }

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLessonId(allLessons[currentLessonIndex - 1].id)
      setIsPlaying(true)
      toast.info(`Playing: ${allLessons[currentLessonIndex - 1].title.slice(0, 45)}...`)
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setNotesList((prev) => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        time: "06:30",
        text: newNote.trim(),
      },
    ])
    setNewNote("")
    toast.success("Study note saved at 06:30")
  }

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    setQuestionsList((prev) => [
      {
        id: `q-${Date.now()}`,
        author: "You",
        question: newQuestion.trim(),
        votes: 1,
        answers: 0,
        time: "04:15",
      },
      ...prev,
    ])
    setNewQuestion("")
    toast.success("Question posted to Q&A discussion board")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        {/* Top-Right Floating Avatar (No Top Navbar) */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* 2-Column Main Learning Workspace */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* ======================================================== */}
            {/* CENTER COLUMN: Main Video Player & Transparent Tabs Area */}
            {/* ======================================================== */}
            <main className="lg:col-span-8 space-y-6">
              
              {/* Back to Course Overview Link */}
              <div>
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>← Previous</span>
                </Link>
              </div>

              {/* Dynamic Lesson Title */}
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-sans leading-tight">
                  {currentLesson.title}
                </h1>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {currentLesson.description || COURSE_PLAYLIST_DATA.subtitle}
                </p>
              </div>

              {/* Main 16:9 Interactive Video Player */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-neutral-950 shadow-2xl flex flex-col justify-between group">
                {/* Visual Background Canvas Texture */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute inset-0 bg-radial from-primary/15 via-transparent to-black/80 pointer-events-none" />

                {/* Video Watermark Badge */}
                <div className="relative z-10 flex items-center justify-between p-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                    HD 1080p • 60fps
                  </span>

                  <span className="text-[11px] font-mono text-neutral-400">
                    LearnioX Player v2.4
                  </span>
                </div>

                {/* Big Center Play / Pause Indicator Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="relative z-10 m-auto flex size-16 sm:size-20 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl transition-all duration-200 hover:scale-110 hover:bg-primary cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="size-8 fill-current" />
                  ) : (
                    <Play className="size-8 fill-current ml-1" />
                  )}
                </button>

                {/* Bottom Video Controls Scrubber Bar */}
                <div className="relative z-10 p-4 space-y-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  {/* Timeline Scrubber */}
                  <div className="group/track relative h-1.5 w-full rounded-full bg-white/20 cursor-pointer overflow-hidden transition-all hover:h-2.5">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-150"
                      style={{ width: isPlaying ? "42%" : "25%" }}
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-neutral-300">
                        {isPlaying ? "07:45" : "04:15"} / {currentLesson.duration}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Playback Speed Picker */}
                      <button
                        type="button"
                        onClick={() => {
                          const speeds = ["1x", "1.25x", "1.5x", "2x"]
                          const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length
                          setPlaybackSpeed(speeds[nextIdx])
                        }}
                        className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        {playbackSpeed}
                      </button>

                      <button
                        type="button"
                        onClick={() => toast.info("Fullscreen toggled")}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* TRANSPARENT TAB BAR & CONTEXTUAL CONTENT AREA            */}
              {/* ======================================================== */}
              <div className="space-y-4">
                {/* Transparent Tab Header Navigation */}
                <div className="flex items-center gap-1 border-b border-border/60 pb-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("live")}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      activeTab === "live"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Radio className="size-3.5" />
                    <span>Overview & Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("qa")}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      activeTab === "qa"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <HelpCircle className="size-3.5" />
                    <span>Q&A ({questionsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      activeTab === "notes"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <FileText className="size-3.5" />
                    <span>Notes ({notesList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("discussions")}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      activeTab === "discussions"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <MessageSquare className="size-3.5" />
                    <span>Discussions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("resources")}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      activeTab === "resources"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Code className="size-3.5" />
                    <span>Resources</span>
                  </button>
                </div>

                {/* Tab Content: Overview & Live */}
                {activeTab === "live" && (
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 animate-in fade-in-0 duration-200">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Key Lesson Takeaways
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLesson.description ||
                          "In this lesson, we explore production deployment patterns for autonomous DevOps agents with strict permission gating, structured telemetry tracing, and automated fail-safe triggers."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          RBAC Token Isolation
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Scope agent execution tokens to minimum necessary namespace roles.
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          Circuit Breaker Halts
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Instant execution pause when abnormal error rate or hallucination is flagged.
                        </p>
                      </div>
                    </div>

                    {/* Lesson Transcript Snippet */}
                    <div className="pt-3 border-t border-border/60 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-sans">
                        Live Lesson Transcript
                      </span>
                      <p className="text-xs text-muted-foreground/90 font-mono bg-secondary/20 p-3 rounded-lg leading-relaxed">
                        {currentLesson.transcript ||
                          `[00:00] Initializing autonomous watcher daemon... \n[02:15] Ingesting CrashLoopBackOff pod telemetry...\n[04:30] Executing RBAC permission checks for namespace 'production-services'...`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab Content: Q&A */}
                {activeTab === "qa" && (
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 animate-in fade-in-0 duration-200">
                    <form onSubmit={handleAddQuestion} className="space-y-2">
                      <label className="text-xs font-bold text-foreground font-sans">
                        Ask a Question for this Video
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="e.g. How do we prevent agent deadlocks when two remediation actions touch the same pod?"
                          className="flex-1 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          <Send className="size-3.5" />
                          <span>Ask</span>
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3 pt-2">
                      {questionsList.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground font-sans">
                              {q.author}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              At {q.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {q.question}
                          </p>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="size-3" />
                              <span>{q.votes} upvotes</span>
                            </button>
                            <span>{q.answers} instructor answers</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Notes */}
                {activeTab === "notes" && (
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 animate-in fade-in-0 duration-200">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground font-sans">
                          Take Timestamped Study Note
                        </label>
                        <span className="text-[10px] font-mono text-primary font-bold">
                          Timestamp: 06:30
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Type your notes or code memo here..."
                          className="flex-1 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          <Bookmark className="size-3.5" />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 pt-2">
                      {notesList.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3"
                        >
                          <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0">
                            {note.time}
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Discussions */}
                {activeTab === "discussions" && (
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 animate-in fade-in-0 duration-200">
                    <h3 className="text-xs font-bold text-foreground font-sans">
                      Community Discussion Thread
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Discuss code challenges, share agent workflows, and collaborate with peer engineers.
                    </p>
                    <div className="rounded-xl border border-dashed border-border/80 bg-secondary/20 p-6 text-center text-xs text-muted-foreground">
                      Join the discussion for <strong className="text-foreground">{currentLesson.title}</strong>
                    </div>
                  </div>
                )}

                {/* Tab Content: Resources */}
                {activeTab === "resources" && (
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 animate-in fade-in-0 duration-200">
                    <h3 className="text-xs font-bold text-foreground font-sans">
                      Attached Lab Resources & GitHub Code
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="#"
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <Code className="size-3.5 text-primary" />
                          autonomous-devops-agent-starter.zip
                        </span>
                        <span className="text-[10px] font-mono">1.4 MB</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: Course Playlist / Curriculum Card Panel    */}
            {/* ======================================================== */}
            <aside className="lg:col-span-4 w-full">
              <div className="sticky top-6 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
                
                {/* Playlist Card Header */}
                <div className="space-y-2 border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-primary font-mono uppercase">
                      {COURSE_PLAYLIST_DATA.tag}
                    </span>
                    <span className="text-xs font-bold font-mono text-primary">
                      {currentLessonIndex + 1} / {totalCount}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold tracking-tight text-foreground font-sans leading-snug">
                    {COURSE_PLAYLIST_DATA.title}
                  </h2>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {COURSE_PLAYLIST_DATA.subtitle}
                  </p>

                  {/* Playlist Progress Track */}
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.round(((currentLessonIndex + 1) / totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollable Playlist Modules & Lessons */}
                <div className="max-h-[380px] overflow-y-auto no-scrollbar space-y-4 pr-1">
                  {COURSE_PLAYLIST_DATA.modules.map((mod) => (
                    <div key={mod.id} className="space-y-1.5">
                      {/* Module Section Title Header */}
                      <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-sans">
                        {mod.title}
                      </div>

                      {/* Module Lessons List */}
                      <div className="space-y-1">
                        {mod.lessons.map((lesson) => {
                          const isActive = lesson.id === activeLessonId

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => {
                                setActiveLessonId(lesson.id)
                                setIsPlaying(true)
                              }}
                              className={cn(
                                "w-full flex items-start gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all cursor-pointer group",
                                isActive
                                  ? "bg-primary/10 border border-primary/30 text-primary font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                              )}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isActive ? (
                                  <div className="size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold animate-pulse">
                                    ▶
                                  </div>
                                ) : lesson.completed ? (
                                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                                ) : (
                                  <div className="size-3.5 rounded-full border border-border" />
                                )}
                              </div>

                              <div className="grid leading-tight truncate flex-1 min-w-0">
                                <span
                                  className={cn(
                                    "truncate font-medium font-sans text-xs",
                                    isActive
                                      ? "text-primary font-bold"
                                      : "text-foreground group-hover:text-primary"
                                  )}
                                >
                                  {lesson.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {lesson.readTime} • {lesson.duration}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Topic Switcher Buttons */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    disabled={currentLessonIndex === 0}
                    onClick={handlePrevLesson}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous Topic</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentLessonIndex === allLessons.length - 1}
                    onClick={handleNextLesson}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <span>Next Topic</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>

              </div>
            </aside>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
