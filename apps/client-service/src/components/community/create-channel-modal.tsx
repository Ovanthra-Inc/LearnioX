"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CommunityType,
  COMMUNITY_TYPE_CONFIG,
} from "@/types/community"
import {
  Plus,
  BookOpen,
  Globe,
  Lock,
  Sparkles,
  ShieldCheck,
  Megaphone,
  Users,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (channelData: any, welcomeMessage?: string) => void
}

const AVAILABLE_COURSES = [
  { id: "c1", title: "Full-Stack Web Development & Microservices Mastery" },
  { id: "c2", title: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)" },
  { id: "c3", title: "Distributed Systems & Cloud DevOps Engineering" },
  { id: "c4", title: "High Performance Database Design & Indexing" },
  { id: "c5", title: "Modern React & Next.js App Router Architecture" },
  { id: "c6", title: "Cybersecurity & Multi-Tenant Authorization (RBAC/ABAC)" },
]

export function CreateChannelModal({
  isOpen,
  onClose,
  onCreate,
}: CreateChannelModalProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<CommunityType>("COURSE_CHANNEL")
  const [selectedCourseId, setSelectedCourseId] = useState("c1")
  const [isPublic, setIsPublic] = useState(true)
  const [isFreeAccessible, setIsFreeAccessible] = useState(true)
  const [description, setDescription] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState(
    "👋 Welcome to the official course community channel! Ask questions and share project progress here."
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const selectedCourse = AVAILABLE_COURSES.find((c) => c.id === selectedCourseId)

    onCreate(
      {
        title: title.trim(),
        description: description.trim() || `Official ${title} discussion hub and student community.`,
        type,
        courseId: type === "COURSE_CHANNEL" || type === "DOUBT_SOLVING" || type === "STUDY_GROUP" ? selectedCourseId : undefined,
        courseTitle: selectedCourse?.title,
        isPublic,
        isFreeAccessible,
        rules: [
          {
            title: "Professional Standards",
            description: "Respect fellow peers, TAs, and instructors at all times.",
          },
          {
            title: "Code Formatting",
            description: "Use markdown code formatting for snippets.",
          },
        ],
      },
      welcomeMessage.trim() || undefined
    )

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold font-sans">
                Create Community Channel
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set up a course-specific channel or open institution lounge for students.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          {/* 1. Channel Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Channel Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Microservices Cohort 2026"
              className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-sans"
            />
          </div>

          {/* 2. Community Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Community Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "COURSE_CHANNEL",
                  "STUDY_GROUP",
                  "DOUBT_SOLVING",
                  "ANNOUNCEMENT_ONLY",
                  "GENERAL_LOUNGE",
                ] as CommunityType[]
              ).map((t) => {
                const conf = COMMUNITY_TYPE_CONFIG[t]
                const isSelected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground font-semibold"
                        : "border-border/70 bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold font-sans">
                      {conf.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {conf.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Link to Specific Course (if applicable) */}
          {(type === "COURSE_CHANNEL" || type === "DOUBT_SOLVING" || type === "STUDY_GROUP") && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-primary" />
                <span>Link to Course Curriculum</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-sans cursor-pointer"
              >
                {AVAILABLE_COURSES.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Public Access & Free Student Toggle */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Globe className="size-3.5 text-emerald-400" />
                  <span>Public & External Student Access</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Allow students outside verified cohorts and free course learners to preview and join.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked)
                  if (!e.target.checked) setIsFreeAccessible(false)
                  else setIsFreeAccessible(true)
                }}
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Description & Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should students discuss or learn in this channel?"
              className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-sans"
            />
          </div>

          {/* 6. Welcome Announcement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Initial Welcome Announcement Post
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="First pinned broadcast message to welcome students..."
              className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-sans"
            />
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
            >
              Create Community Channel
            </button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
