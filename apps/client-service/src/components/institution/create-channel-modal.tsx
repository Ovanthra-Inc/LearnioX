"use client"

import React, { useState } from "react"
import {
  Hash,
  Volume2,
  Lock,
  Megaphone,
  BookOpen,
  HelpCircle,
  Users,
  Shield,
  X,
  Sparkles,
} from "lucide-react"
import { DiscordCategory, CommunityType } from "@/types/community"
import { cn } from "@/lib/utils"

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: DiscordCategory
  courses?: { id: string; title: string }[]
  onCreateChannel: (data: {
    title: string
    description: string
    category: DiscordCategory
    type: CommunityType
    courseId?: string
    courseTitle?: string
    isPublic: boolean
    isFreeAccessible: boolean
    welcomeMessage?: string
  }) => void
}

export function CreateChannelModal({
  isOpen,
  onClose,
  initialCategory = "COURSE_CHANNELS",
  courses = [],
  onCreateChannel,
}: CreateChannelModalProps) {
  const [category, setCategory] = useState<DiscordCategory>(initialCategory)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "")
  const [isPublic, setIsPublic] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState("")

  if (!isOpen) return null

  const CATEGORY_CONFIG: {
    id: DiscordCategory
    label: string
    icon: React.ElementType
    type: CommunityType
    desc: string
  }[] = [
    {
      id: "COURSE_CHANNELS",
      label: "Course Discussion",
      icon: BookOpen,
      type: "COURSE_CHANNEL",
      desc: "Synchronized chat room for student questions and assignments",
    },
    {
      id: "ANNOUNCEMENTS",
      label: "Announcements & Broadcasts",
      icon: Megaphone,
      type: "ANNOUNCEMENT_ONLY",
      desc: "One-way official institution broadcasts and exam dates",
    },
    {
      id: "DOUBT_DESKS",
      label: "24/7 Doubt Desk",
      icon: HelpCircle,
      type: "DOUBT_SOLVING",
      desc: "Rapid TA debugging and code problem resolution",
    },
    {
      id: "FACULTY_ONLY",
      label: "Faculty & Staff Only",
      icon: Lock,
      type: "GENERAL_LOUNGE",
      desc: "Private channel restricted to verified educators and admins",
    },
    {
      id: "VOICE_ROOMS",
      label: "Voice & Office Hours",
      icon: Volume2,
      type: "GENERAL_LOUNGE",
      desc: "Live audio room and real-time screen sharing sandbox",
    },
  ]

  const currentConfig = CATEGORY_CONFIG.find((c) => c.id === category) || CATEGORY_CONFIG[0]

  const handleNameChange = (val: string) => {
    // Discord-style lowercase kebab-case
    const formatted = val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "")
    setName(formatted)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const chosenCourse = courses.find((c) => c.id === selectedCourseId)

    onCreateChannel({
      title: name.trim(),
      description: description.trim() || currentConfig.desc,
      category,
      type: currentConfig.type,
      courseId: category === "COURSE_CHANNELS" || category === "DOUBT_DESKS" ? chosenCourse?.id : undefined,
      courseTitle: category === "COURSE_CHANNELS" || category === "DOUBT_DESKS" ? chosenCourse?.title : undefined,
      isPublic: category === "FACULTY_ONLY" ? false : isPublic,
      isFreeAccessible: category === "FACULTY_ONLY" ? false : isPublic,
      welcomeMessage: welcomeMessage.trim() || undefined,
    })

    setName("")
    setDescription("")
    setWelcomeMessage("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-foreground font-sans flex items-center gap-2">
              <Hash className="size-5 text-primary" />
              <span>Create Institution Channel</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Add a new discussion hub to your institution Discord server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Channel Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_CONFIG.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                        : "bg-background border-border hover:bg-secondary text-foreground"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0 mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{cat.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{cat.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-1">
            <label className="font-bold text-foreground flex items-center justify-between">
              <span>Channel Name</span>
              <span className="text-[10px] text-muted-foreground font-normal">lowercase with hyphens</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-mono text-xs">#</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. fast-api-advanced-labs"
                className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Linked Course (if Course/Doubt category) */}
          {(category === "COURSE_CHANNELS" || category === "DOUBT_DESKS") && courses.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-foreground">Connected Curriculum Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value)
                  const course = courses.find((c) => c.id === e.target.value)
                  if (course && !name) {
                    handleNameChange(course.title)
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-sans"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-foreground">Topic & Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
            />
          </div>

          {/* Welcome Announcement */}
          <div className="space-y-1">
            <label className="font-bold text-foreground">Initial Welcome Announcement (Optional)</label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome everyone! Post your doubts and feedback here."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
            />
          </div>

          {/* Privacy Toggle */}
          {category !== "FACULTY_ONLY" && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/60">
              <div>
                <div className="font-bold text-foreground">Public & Free Student Access</div>
                <div className="text-[10px] text-muted-foreground">
                  Allow any enrolled student to join and view discussions
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="size-4 accent-primary rounded cursor-pointer"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer disabled:opacity-40"
            >
              Create Channel
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
