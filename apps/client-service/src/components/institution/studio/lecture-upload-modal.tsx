"use client"

import React, { useState } from "react"
import {
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Layers,
  Code,
  HelpCircle,
  Clock,
  Globe,
  Lock,
  Calendar,
  X,
  AlertCircle,
  Check,
  Radio,
  FileCheck,
  Volume2,
  FileCode,
  Loader2,
  Paperclip,
} from "lucide-react"
import { VideoVisibility, StudioLecture } from "@/types/studio"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface LectureUploadModalProps {
  isOpen: boolean
  onClose: () => void
  courses: { id: string; title: string }[]
  onUploadComplete: (lecture: Partial<StudioLecture>) => void
}

export function LectureUploadModal({
  isOpen,
  onClose,
  courses,
  onUploadComplete,
}: LectureUploadModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [fileSelected, setFileSelected] = useState<boolean>(true)
  const [fileName, setFileName] = useState<string>("FastAPI_Async_Architecture_Lesson.mp4")
  const [fileSize, setFileSize] = useState<string>("248.5 MB")

  // Form Fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "")
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
  )
  const [enableCommunityAnnouncement, setEnableCommunityAnnouncement] = useState<boolean>(true)

  // Interactive Elements
  const [hasSandbox, setHasSandbox] = useState<boolean>(true)
  const [sandboxEnvironment, setSandboxEnvironment] = useState<string>("Python 3.12 + FastAPI")
  const [hasQuiz, setHasQuiz] = useState<boolean>(false)
  const [quizTimestamp, setQuizTimestamp] = useState<string>("12:30")

  // Visibility
  const [visibility, setVisibility] = useState<VideoVisibility>("ENROLLED_ONLY")
  const [isPublishing, setIsPublishing] = useState<boolean>(false)

  if (!isOpen) return null

  const handleFinishUpload = () => {
    if (!title.trim()) {
      toast.error("Please provide a lecture title.")
      setStep(1)
      return
    }

    setIsPublishing(true)
    const chosenCourse = courses.find((c) => c.id === selectedCourseId)

    setTimeout(() => {
      onUploadComplete({
        id: `lec-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || "Comprehensive video lecture and coding walkthrough.",
        duration: "24:15",
        durationSeconds: 1455,
        thumbnailUrl: thumbnailUrl,
        courseId: selectedCourseId,
        courseTitle: chosenCourse?.title || "Full-Stack Web Development & Microservices Mastery",
        moduleId: "m1",
        moduleTitle: "Module 1: Core Architectures",
        visibility: visibility,
        status: "READY",
        createdAt: "Just now",
        viewsCount: 0,
        doubtsCount: 0,
        completionRate: 0,
        rating: 5.0,
        hasSubtitles: true,
        hasSandbox: hasSandbox,
        hasQuiz: hasQuiz,
      })

      setIsPublishing(false)
      toast.success(
        enableCommunityAnnouncement
          ? `Lecture "${title}" published! Automatic notification sent to the course community channel.`
          : `Lecture "${title}" published successfully!`
      )
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* YouTube Studio Upload Modal Dialog */}
      <div className="relative z-50 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Top Wizard Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-sidebar/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <Upload className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground font-sans">
                {title ? title : "Upload Course Video & Lecture"}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{fileName}</span>
                <span>•</span>
                <span>{fileSize}</span>
                <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                  <CheckCircle2 className="size-3" />
                  <span>Upload complete (100%)</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* 4-Step Progress Indicator (YouTube Studio Style) */}
        <div className="px-6 py-3 border-b border-border/60 bg-background/50 grid grid-cols-4 gap-2 text-xs font-semibold shrink-0">
          {[
            { num: 1, label: "Details" },
            { num: 2, label: "Interactive Elements" },
            { num: 3, label: "AI Checks & Subtitles" },
            { num: 4, label: "Visibility" },
          ].map((item) => {
            const isDone = step > item.num
            const isCurrent = step === item.num
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num as any)}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all text-left cursor-pointer",
                  isCurrent
                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                    : isDone
                    ? "text-foreground hover:bg-secondary"
                    : "text-muted-foreground opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                      ? "bg-emerald-500 text-black"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3" /> : item.num}
                </span>
                <span className="truncate hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* ========================================================================= */}
          {/* STEP 1: DETAILS                                                           */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-50">
              {/* Lecture Title */}
              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Lecture Title (required)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">{title.length}/100</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1.3 Async Database Pooling & Docker Deployment"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Lecture Description & Key Takeaways</span>
                  <span className="text-[10px] text-muted-foreground">Markdown supported</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the architectural concepts, prerequisites, and code commands covered in this lecture..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans leading-relaxed"
                />
              </div>

              {/* Course Assignment */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">Assign to Course Curriculum Track</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-sans"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thumbnail Selector */}
              <div className="space-y-2">
                <label className="font-bold text-foreground">Lecture Thumbnail</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative aspect-video rounded-xl border-2 border-primary overflow-hidden shadow-xs">
                    <img src={thumbnailUrl} alt="Thumbnail 1" className="size-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.2 rounded text-[9px] font-bold text-white">
                      Selected
                    </span>
                  </div>
                  <div
                    onClick={() =>
                      setThumbnailUrl(
                        "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80"
                      )
                    }
                    className="relative aspect-video rounded-xl border border-border overflow-hidden hover:border-primary cursor-pointer transition-colors"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80"
                      alt="Thumbnail 2"
                      className="size-full object-cover"
                    />
                  </div>
                  <div
                    onClick={() =>
                      setThumbnailUrl(
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                      )
                    }
                    className="relative aspect-video rounded-xl border border-border overflow-hidden hover:border-primary cursor-pointer transition-colors"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                      alt="Thumbnail 3"
                      className="size-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Community Announcement Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Synchronize Community Announcement</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically broadcast a release notification and discussion link to the course channel.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableCommunityAnnouncement}
                  onChange={(e) => setEnableCommunityAnnouncement(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: INTERACTIVE ELEMENTS                                              */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50">
              <p className="text-muted-foreground text-xs">
                Enhance your lecture with interactive cloud sandboxes, checkpoint quizzes, and source code downloads.
              </p>

              {/* Element 1: Interactive Code Sandbox */}
              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Code className="size-4" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">Interactive Hands-On Sandbox</div>
                      <div className="text-[11px] text-muted-foreground">Embed a live terminal & browser preview</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasSandbox}
                    onChange={(e) => setHasSandbox(e.target.checked)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {hasSandbox && (
                  <div className="pt-2 pl-10 space-y-1">
                    <label className="font-bold text-foreground">Sandbox Template Environment</label>
                    <select
                      value={sandboxEnvironment}
                      onChange={(e) => setSandboxEnvironment(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Python 3.12 + FastAPI">Python 3.12 + FastAPI + PostgreSQL 16</option>
                      <option value="Next.js 14 App Router">Next.js 14 App Router + Tailwind CSS</option>
                      <option value="Docker Multi-Container">Docker Compose + Nginx Ingress</option>
                      <option value="PyTorch + LangChain">PyTorch 2.2 + LangChain + pgvector</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Element 2: Quiz Checkpoint */}
              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <HelpCircle className="size-4" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">Video Checkpoint Quiz</div>
                      <div className="text-[11px] text-muted-foreground">Pause video at timestamp to test retention</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasQuiz}
                    onChange={(e) => setHasQuiz(e.target.checked)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {hasQuiz && (
                  <div className="pt-2 pl-10 space-y-1">
                    <label className="font-bold text-foreground">Timestamp Trigger (MM:SS)</label>
                    <input
                      type="text"
                      value={quizTimestamp}
                      onChange={(e) => setQuizTimestamp(e.target.value)}
                      placeholder="12:30"
                      className="w-32 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground font-mono outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Element 3: Downloadable Solution Files */}
              <div className="p-4 rounded-xl border border-border bg-background/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Attach Downloadable Source Code & Notes</div>
                    <div className="text-[11px] text-muted-foreground">solution_code.zip (4.2 MB) attached</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: AI CHECKS & SUBTITLES                                             */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="rounded-xl border border-border bg-background/80 p-4 space-y-4">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>Automated AI Quality & Copyright Verification</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/80">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="size-4 text-emerald-500" />
                      <div>
                        <div className="font-bold text-foreground">Copyright & Plagiarism Check</div>
                        <div className="text-[11px] text-muted-foreground">No copyrighted third-party media detected</div>
                      </div>
                    </div>
                    <span className="text-emerald-500 font-bold text-xs">Passed</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/80">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="size-4 text-emerald-500" />
                      <div>
                        <div className="font-bold text-foreground">Audio Clarity & Normalization</div>
                        <div className="text-[11px] text-muted-foreground">High fidelity 48kHz Stereo with noise gate applied</div>
                      </div>
                    </div>
                    <span className="text-emerald-500 font-bold text-xs">Optimal</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/80">
                    <div className="flex items-center gap-2.5">
                      <FileCode className="size-4 text-primary" />
                      <div>
                        <div className="font-bold text-foreground">AI Speech-to-Text & Subtitles</div>
                        <div className="text-[11px] text-muted-foreground">Generated English transcript (1,842 words) + multi-language captions</div>
                      </div>
                    </div>
                    <span className="text-primary font-bold text-xs">Generated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: VISIBILITY                                                        */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in-50">
              <p className="text-muted-foreground text-xs">
                Choose who can access this lecture and when it should be published.
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: "ENROLLED_ONLY" as const,
                    title: "Enrolled Students Only (Recommended)",
                    desc: "Accessible only to registered students in this course track.",
                    icon: Lock,
                  },
                  {
                    id: "PUBLIC" as const,
                    title: "Public & Free (Marketing Preview)",
                    desc: "Anyone on the internet or external student can watch this lecture without enrolling.",
                    icon: Globe,
                  },
                  {
                    id: "SCHEDULED" as const,
                    title: "Schedule Release",
                    desc: "Make this lecture public at a specific date and time for cohort progression.",
                    icon: Calendar,
                  },
                  {
                    id: "PRIVATE" as const,
                    title: "Private Draft",
                    desc: "Only institution owners and authorized faculty can view and edit.",
                    icon: AlertCircle,
                  },
                ].map((item) => {
                  const isSelected = visibility === item.id
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => setVisibility(item.id)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs"
                          : "bg-background/80 border-border hover:bg-secondary/60"
                      )}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={isSelected}
                        onChange={() => setVisibility(item.id)}
                        className="mt-1 size-4 accent-primary cursor-pointer"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Icon className="size-3.5 text-primary" />
                          <span>{item.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-sidebar/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep((step - 1) as any)
              else onClose()
            }}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    toast.error("Please enter a lecture title.")
                    return
                  }
                  setStep((step + 1) as any)
                }}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishUpload}
                disabled={isPublishing}
                className="rounded-xl bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Lecture</span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
