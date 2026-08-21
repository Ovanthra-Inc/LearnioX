"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Layers,
  Sparkles,
  DollarSign,
  Award,
  Globe,
  Lock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Video,
  Code,
  HelpCircle,
  Save,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface LessonDraft {
  id: string
  title: string
  duration: string
  type: "VIDEO" | "SANDBOX" | "QUIZ"
}

interface ModuleDraft {
  id: string
  title: string
  lessons: LessonDraft[]
}

interface CourseCreateStepperProps {
  institutionId: string
  onCancel: () => void
  onComplete?: () => void
}

export function CourseCreateStepper({
  institutionId,
  onCancel,
  onComplete,
}: CourseCreateStepperProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isPublishing, setIsPublishing] = useState(false)

  // Step 1: Basic Details
  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Full-Stack & Cloud")
  const [level, setLevel] = useState("Intermediate")
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
  )
  const [enableCommunitySync, setEnableCommunitySync] = useState(true)

  // Step 2: Curriculum & Modules
  const [modules, setModules] = useState<ModuleDraft[]>([
    {
      id: "mod-1",
      title: "Module 1: Foundations & Architecture",
      lessons: [
        { id: "les-1", title: "1.1 Introduction & Setup", duration: "12:40", type: "VIDEO" },
        { id: "les-2", title: "1.2 Live Coding Sandbox: Database Setup", duration: "25:00", type: "SANDBOX" },
        { id: "les-3", title: "1.3 Concept Checkpoint Quiz", duration: "05:00", type: "QUIZ" },
      ],
    },
  ])

  // Step 3: Pricing & Certification
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState("49")
  const [enableCertificate, setEnableCertificate] = useState(true)
  const [objectives, setObjectives] = useState<string[]>([
    "Architect resilient distributed microservices using FastAPI and Docker",
    "Implement real-time bidirectional communication with WebSockets and Redis",
    "Deploy scalable containerized applications with Nginx reverse proxy",
  ])
  const [newObjective, setNewObjective] = useState("")

  // Step 4: Visibility
  const [visibility, setVisibility] = useState<"PUBLIC" | "ENROLLED_ONLY" | "SCHEDULED" | "PRIVATE">("PUBLIC")

  // Handlers for Curriculum
  const handleAddModule = () => {
    const newMod: ModuleDraft = {
      id: `mod-${Date.now()}`,
      title: `Module ${modules.length + 1}: Advanced Topics`,
      lessons: [
        {
          id: `les-${Date.now()}`,
          title: "Introduction to Advanced Concepts",
          duration: "15:00",
          type: "VIDEO",
        },
      ],
    }
    setModules([...modules, newMod])
  }

  const handleDeleteModule = (modId: string) => {
    if (modules.length <= 1) {
      toast.error("A course must have at least one module.")
      return
    }
    setModules(modules.filter((m) => m.id !== modId))
  }

  const handleAddLesson = (modId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m
        return {
          ...m,
          lessons: [
            ...m.lessons,
            {
              id: `les-${Date.now()}`,
              title: `New Lesson ${m.lessons.length + 1}`,
              duration: "20:00",
              type: "VIDEO",
            },
          ],
        }
      })
    )
  }

  const handleDeleteLesson = (modId: string, lesId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m
        if (m.lessons.length <= 1) {
          toast.error("A module must have at least one lesson.")
          return m
        }
        return {
          ...m,
          lessons: m.lessons.filter((l) => l.id !== lesId),
        }
      })
    )
  }

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newObjective.trim()) return
    setObjectives([...objectives, newObjective.trim()])
    setNewObjective("")
  }

  const handlePublishCourse = () => {
    if (!title.trim()) {
      toast.error("Please enter a course title.")
      setStep(1)
      return
    }

    setIsPublishing(true)
    setTimeout(() => {
      setIsPublishing(false)
      toast.success(
        enableCommunitySync
          ? `Course "${title}" created successfully! #${title.toLowerCase().replace(/[^a-z0-9]/g, "-")} community channel initialized.`
          : `Course "${title}" created successfully!`
      )
      if (onComplete) onComplete()
      else onCancel()
    }, 1000)
  }

  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col space-y-0">
      
      {/* ========================================================================= */}
      {/* TOP STEPPER ACTION HEADER                                                 */}
      {/* ========================================================================= */}
      <div className="px-5 py-3 border-b border-border bg-sidebar/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Studio</span>
          </button>

          <div className="h-4 w-px bg-border" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-foreground font-sans truncate max-w-sm sm:max-w-md">
                {title ? title : "New Course Track Authoring"}
              </h2>
              <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.2 text-[9px] font-bold uppercase">
                DRAFT
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => toast.info("Draft auto-saved.")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <Save className="size-3.5" />
            <span>Save Draft</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  toast.error("Please enter a course title.")
                  return
                }
                setStep((step + 1) as any)
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublishCourse}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-5 py-1.5 text-xs font-bold text-primary-foreground shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Publish Course Track</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4-STEP PROGRESS INDICATOR                                                 */}
      {/* ========================================================================= */}
      <div className="border-b border-border/80 bg-background/50 px-5 py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            { num: 1, label: "1. Details & Community", icon: BookOpen },
            { num: 2, label: "2. Curriculum & Sandboxes", icon: Layers },
            { num: 3, label: "3. Pricing & Certification", icon: Award },
            { num: 4, label: "4. AI Checks & Visibility", icon: Sparkles },
          ].map((item) => {
            const isDone = step > item.num
            const isCurrent = step === item.num
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  if (item.num === 1 || title.trim()) {
                    setStep(item.num as any)
                  } else {
                    toast.error("Please enter a course title first.")
                  }
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl transition-all text-left cursor-pointer",
                  isCurrent
                    ? "bg-primary/10 border border-primary/30 text-primary font-bold shadow-xs"
                    : isDone
                    ? "text-foreground hover:bg-secondary"
                    : "text-muted-foreground opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                      ? "bg-emerald-500 text-black font-bold"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3" /> : item.num}
                </div>
                <div className="truncate text-xs">{item.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP CONTENT BODY                                                         */}
      {/* ========================================================================= */}
      <div className="p-6 space-y-6">
        
        {/* STEP 1: DETAILS & COMMUNITY */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Fields */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Course Title */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground text-xs flex items-center justify-between">
                    <span>Course Title (required)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">{title.length}/100</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Web Development & Microservices Mastery"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
                  />
                </div>

                {/* Subtitle / Tagline */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground text-xs">Subtitle / Short Summary</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Master asynchronous FastAPI, Next.js 14 App Router, Docker, and PostgreSQL."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground text-xs flex items-center justify-between">
                    <span>Comprehensive Course Description</span>
                    <span className="text-[10px] text-muted-foreground">Markdown supported</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write an in-depth breakdown of the hands-on projects, architectures, and outcomes..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans leading-relaxed"
                  />
                </div>

                {/* Category & Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground text-xs">Category Track</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-sans"
                    >
                      <option value="Full-Stack & Cloud">Full-Stack & Cloud</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="DevOps & Kubernetes">DevOps & Kubernetes</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground text-xs">Difficulty Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-sans"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Master">Master</option>
                    </select>
                  </div>
                </div>

                {/* Community Sync Toggle */}
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-primary" />
                      <span className="font-bold text-foreground text-xs">
                        Auto-Synchronize Discord Community Channel
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableCommunitySync}
                      onChange={(e) => setEnableCommunitySync(e.target.checked)}
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    When enabled, creating this course will automatically create a dedicated channel (
                    <code className="text-primary font-bold">
                      #{title ? title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "course-name"}
                    </code>
                    ) in your institution's Discord workspace. Enrolled students will automatically gain channel access.
                  </p>
                </div>

              </div>

              {/* Thumbnail Column */}
              <div className="space-y-4">
                <label className="font-bold text-foreground text-xs">Course Card Preview</label>
                
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs space-y-3">
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    <img src={thumbnailUrl} alt="Thumbnail Preview" className="size-full object-cover" />
                    <span className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-primary">
                      {level}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                      {category}
                    </span>
                    <h3 className="font-bold text-foreground text-xs line-clamp-2">
                      {title || "Course Title Preview"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {tagline || "Your course tagline and brief curriculum overview will appear here."}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground text-[11px]">Select Thumbnail</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
                    ].map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setThumbnailUrl(url)}
                        className={cn(
                          "relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all",
                          thumbnailUrl === url ? "border-primary ring-2 ring-primary/40" : "border-border hover:opacity-80"
                        )}
                      >
                        <img src={url} alt={`Thumb ${i}`} className="size-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CURRICULUM */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Curriculum & Hands-On Labs</h3>
                <p className="text-xs text-muted-foreground">Add modules and attach interactive coding sandboxes or quizzes.</p>
              </div>
              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-3">
              {modules.map((mod, modIndex) => (
                <div key={mod.id} className="rounded-xl border border-border bg-background/70 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                        {modIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => {
                          const newTitle = e.target.value
                          setModules(modules.map((m) => (m.id === mod.id ? { ...m, title: newTitle } : m)))
                        }}
                        className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-2 pl-6 sm:pl-8 border-l-2 border-border/80">
                    {mod.lessons.map((les) => (
                      <div
                        key={les.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-card border border-border/80 gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {les.type === "VIDEO" && <Video className="size-3.5 text-primary shrink-0" />}
                          {les.type === "SANDBOX" && <Code className="size-3.5 text-emerald-400 shrink-0" />}
                          {les.type === "QUIZ" && <HelpCircle className="size-3.5 text-purple-400 shrink-0" />}
                          <input
                            type="text"
                            value={les.title}
                            onChange={(e) => {
                              const newLesTitle = e.target.value
                              setModules(
                                modules.map((m) => {
                                  if (m.id !== mod.id) return m
                                  return {
                                    ...m,
                                    lessons: m.lessons.map((l) => (l.id === les.id ? { ...l, title: newLesTitle } : l)),
                                  }
                                })
                              )
                            }}
                            className="flex-1 rounded border border-transparent hover:border-border bg-transparent px-1.5 py-0.5 text-xs text-foreground outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={les.type}
                            onChange={(e) => {
                              const newType = e.target.value as any
                              setModules(
                                modules.map((m) => {
                                  if (m.id !== mod.id) return m
                                  return {
                                    ...m,
                                    lessons: m.lessons.map((l) => (l.id === les.id ? { ...l, type: newType } : l)),
                                  }
                                })
                              )
                            }}
                            className="rounded border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
                          >
                            <option value="VIDEO">Video</option>
                            <option value="SANDBOX">Sandbox</option>
                            <option value="QUIZ">Quiz</option>
                          </select>

                          <input
                            type="text"
                            value={les.duration}
                            onChange={(e) => {
                              const newDur = e.target.value
                              setModules(
                                modules.map((m) => {
                                  if (m.id !== mod.id) return m
                                  return {
                                    ...m,
                                    lessons: m.lessons.map((l) => (l.id === les.id ? { ...l, duration: newDur } : l)),
                                  }
                                })
                              )
                            }}
                            className="w-14 rounded border border-border bg-background px-1 py-0.5 text-center font-mono text-[11px] text-foreground"
                          />

                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(mod.id, les.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline pt-1 cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Add Lesson</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: PRICING & CERTIFICATION */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 text-xs">
            <div className="rounded-xl border border-border bg-background/80 p-5 space-y-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                <span>Access Model & Pricing</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setIsFree(true)}
                  className={cn(
                    "p-3 rounded-xl border text-center cursor-pointer transition-all",
                    isFree ? "border-primary bg-primary/10 font-bold" : "border-border bg-card"
                  )}
                >
                  <div>Free & Open</div>
                  <div className="text-[10px] text-muted-foreground">Publicly Accessible</div>
                </div>

                <div
                  onClick={() => setIsFree(false)}
                  className={cn(
                    "p-3 rounded-xl border text-center cursor-pointer transition-all",
                    !isFree ? "border-primary bg-primary/10 font-bold" : "border-border bg-card"
                  )}
                >
                  <div>Paid Track</div>
                  <div className="text-[10px] text-muted-foreground">Enrolled Only</div>
                </div>
              </div>

              {!isFree && (
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Enrollment Fee (USD $)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-foreground"
                  />
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Completion Certificate</span>
                  <input
                    type="checkbox"
                    checked={enableCertificate}
                    onChange={(e) => setEnableCertificate(e.target.checked)}
                    className="size-4 accent-primary cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Award cryptographically signed verifiable credentials upon 100% completion.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/80 p-5 space-y-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Learning Objectives</span>
              </h4>

              <div className="space-y-2">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80 gap-2">
                    <span className="text-foreground flex-1">• {obj}</span>
                    <button
                      type="button"
                      onClick={() => setObjectives(objectives.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddObjective} className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add learning objective..."
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4: AI CHECKS & PUBLISH */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in-50 text-xs">
            <div className="rounded-xl border border-border bg-background/80 p-4 space-y-3">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>AI Automated Quality Inspection</span>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/80">
                  <span className="text-foreground font-semibold">Curriculum Structure ({modules.length} modules, {totalLessonsCount} lessons)</span>
                  <span className="text-emerald-500 font-bold">Passed</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/80">
                  <span className="text-foreground font-semibold">Discord Community Synchronization</span>
                  <span className="text-emerald-500 font-bold">Ready</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-foreground">Publish Visibility Setting</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "PUBLIC" as const, title: "Public & Discoverable", desc: "Visible across platform catalog.", icon: Globe },
                  { id: "ENROLLED_ONLY" as const, title: "Enrolled Students Only", desc: "Private to registered students.", icon: Lock },
                  { id: "SCHEDULED" as const, title: "Scheduled Cohort", desc: "Unlocks on scheduled launch date.", icon: Calendar },
                  { id: "PRIVATE" as const, title: "Private Draft", desc: "Institution staff only.", icon: AlertCircle },
                ].map((v) => {
                  const isSelected = visibility === v.id
                  const Icon = v.icon
                  return (
                    <div
                      key={v.id}
                      onClick={() => setVisibility(v.id)}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all cursor-pointer space-y-1",
                        isSelected ? "border-primary bg-primary/10 shadow-xs" : "border-border bg-card hover:bg-secondary/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-3.5 text-primary" />
                          <span className="font-bold text-foreground">{v.title}</span>
                        </div>
                        <input
                          type="radio"
                          name="courseVis"
                          checked={isSelected}
                          onChange={() => setVisibility(v.id)}
                          className="size-3.5 accent-primary cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{v.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground text-sm">Ready to launch your course track?</h4>
                <p className="text-[11px] text-muted-foreground">Your course and synchronized community channel will go live immediately.</p>
              </div>

              <button
                type="button"
                onClick={handlePublishCourse}
                disabled={isPublishing}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Publish Course Track</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
