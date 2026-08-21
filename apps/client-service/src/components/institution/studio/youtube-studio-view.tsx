"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Upload,
  Radio,
  Video,
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Edit,
  BarChart3,
  MessageSquare,
  Play,
  Globe,
  Lock,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Award,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  StudioLecture,
  StudioLiveStream,
  SEED_STUDIO_LECTURES,
  SEED_STUDIO_LIVE_STREAMS,
} from "@/types/studio"
import { LectureUploadModal } from "@/components/institution/studio/lecture-upload-modal"
import { LiveControlRoomModal } from "@/components/institution/studio/live-control-room-modal"
import { CourseCreateStepper } from "@/components/institution/studio/course-create-stepper"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface YouTubeStudioViewProps {
  institution: {
    id: string
    name: string
    slug: string
    role?: string
  }
  courses: { id: string; title: string; level?: string }[]
}

export function YouTubeStudioView({ institution, courses }: YouTubeStudioViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"lectures" | "live" | "courses">("lectures")
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [lectures, setLectures] = useState<StudioLecture[]>(SEED_STUDIO_LECTURES)
  const [liveStreams, setLiveStreams] = useState<StudioLiveStream[]>(SEED_STUDIO_LIVE_STREAMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL")

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [selectedLiveStream, setSelectedLiveStream] = useState<StudioLiveStream | undefined>(undefined)

  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes((institution.role || "OWNER").toUpperCase())

  // Filtered Lectures
  const filteredLectures = lectures.filter((lec) => {
    const matchesSearch =
      searchQuery === "" ||
      lec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lec.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesVisibility =
      visibilityFilter === "ALL" || lec.visibility === visibilityFilter

    return matchesSearch && matchesVisibility
  })

  const handleLectureUpload = (newLecture: Partial<StudioLecture>) => {
    setLectures((prev) => [newLecture as StudioLecture, ...prev])
  }

  const handleDeleteLecture = (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id))
    toast.success("Lecture deleted from studio.")
  }

  if (isCreatingCourse) {
    return (
      <div className="w-full space-y-4">
        <CourseCreateStepper
          institutionId={institution.id}
          onCancel={() => setIsCreatingCourse(false)}
          onComplete={() => setIsCreatingCourse(false)}
        />
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">
      
      {/* ========================================================================= */}
      {/* 1. YOUTUBE STUDIO TOP HEADER & "+ CREATE" ACTION BAR                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground font-sans flex items-center gap-2">
            <Video className="size-5 text-primary" />
            <span>Course Studio & Creator Hub</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your video lectures, live cohort streaming rooms, and authored curriculum tracks.
          </p>
        </div>

        {/* "+ CREATE" Dropdown Button (YouTube Studio Style) */}
        {isOwnerOrAdmin && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>CREATE</span>
                  <ChevronDown className="size-3.5 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-popover-foreground z-50 animate-in zoom-in-95"
              >
                {/* Action 1: Upload Video */}
                <DropdownMenuItem
                  onClick={() => setIsUploadModalOpen(true)}
                  className="gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors font-medium"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Upload className="size-3.5" />
                  </div>
                  <span>Upload Video / Lecture</span>
                </DropdownMenuItem>

                {/* Action 2: Go Live */}
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedLiveStream(liveStreams[0])
                    setIsLiveModalOpen(true)
                  }}
                  className="gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors font-medium"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-rose-600/10 text-rose-500">
                    <Radio className="size-3.5" />
                  </div>
                  <span>Go Live (Live Control Room)</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border/60" />

                {/* Action 3: New Course Track */}
                <DropdownMenuItem
                  onClick={() => setIsCreatingCourse(true)}
                  className="gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors font-medium"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                    <BookOpen className="size-3.5" />
                  </div>
                  <span>New Course Curriculum Track</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. STUDIO NAVIGATION TABS (Videos, Live Streams, Courses)                 */}
      {/* ========================================================================= */}
      <div className="border-b border-border flex space-x-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("lectures")}
          className={cn(
            "pb-3 transition-colors cursor-pointer border-b-2 flex items-center gap-2",
            activeTab === "lectures"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Video className="size-4" />
          <span>Videos & Lectures</span>
          <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
            {lectures.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={cn(
            "pb-3 transition-colors cursor-pointer border-b-2 flex items-center gap-2",
            activeTab === "live"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Radio className="size-4 text-rose-500" />
          <span>Live Streams & Webinars</span>
          <span className="rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold">
            {liveStreams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={cn(
            "pb-3 transition-colors cursor-pointer border-b-2 flex items-center gap-2",
            activeTab === "courses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="size-4" />
          <span>Courses & Curricula</span>
          <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
            {courses.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: VIDEOS & LECTURES (YOUTUBE STUDIO CONTENT TABLE)                 */}
      {/* ========================================================================= */}
      {activeTab === "lectures" && (
        <div className="space-y-4">
          
          {/* Search & Visibility Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter lectures by title or topic..."
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold">Visibility:</span>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer font-sans"
              >
                <option value="ALL">All Visibilities</option>
                <option value="PUBLIC">Public & Free</option>
                <option value="ENROLLED_ONLY">Enrolled Only</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* YouTube Studio Content Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-border/80 bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4 min-w-[320px]">Video / Lecture</th>
                    <th className="py-3 px-3 min-w-[120px]">Visibility</th>
                    <th className="py-3 px-3 min-w-[200px]">Course Track</th>
                    <th className="py-3 px-3 min-w-[100px]">Date</th>
                    <th className="py-3 px-3 min-w-[90px] text-right">Views</th>
                    <th className="py-3 px-3 min-w-[90px] text-right">Doubts</th>
                    <th className="py-3 px-3 min-w-[90px] text-right">Completion</th>
                    <th className="py-3 px-4 min-w-[80px] text-right">Rating</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border/60">
                  {filteredLectures.map((lec) => (
                    <tr
                      key={lec.id}
                      className="hover:bg-sidebar-accent/50 transition-colors group"
                    >
                      {/* Column 1: Thumbnail & Title + Hover Action Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3.5">
                          {/* Video Thumbnail with duration */}
                          <div className="relative aspect-video w-28 sm:w-32 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border shadow-2xs">
                            <img
                              src={lec.thumbnailUrl}
                              alt={lec.title}
                              className="size-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {lec.duration}
                            </span>
                          </div>

                          {/* Title, Description & Hover Action Icons */}
                          <div className="grid leading-tight min-w-0 space-y-1">
                            <span className="font-bold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">
                              {lec.title}
                            </span>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                              {lec.description}
                            </p>

                            {/* YouTube Studio Hover Action Icons */}
                            <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                title="Edit Details"
                                onClick={() => toast.info(`Editing details for ${lec.title}`)}
                                className="p-1 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Edit className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Lecture Analytics"
                                onClick={() => toast.info(`Analytics view for ${lec.title}`)}
                                className="p-1 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <BarChart3 className="size-3.5" />
                              </button>
                              <Link
                                href={`/community?channel=comm-fullstack`}
                                title="View Doubts & Discussion"
                                className="p-1 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageSquare className="size-3.5" />
                              </Link>
                              <Link
                                href={`/courses/${lec.courseId}/learn`}
                                target="_blank"
                                title="Preview on Student Video Player"
                                className="p-1 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Play className="size-3.5 fill-current" />
                              </Link>
                              <button
                                type="button"
                                title="Delete Lecture"
                                onClick={() => handleDeleteLecture(lec.id)}
                                className="p-1 rounded-md bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Visibility */}
                      <td className="py-3 px-3">
                        {lec.visibility === "PUBLIC" && (
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[11px]">
                            <Globe className="size-3" />
                            <span>Public</span>
                          </span>
                        )}
                        {lec.visibility === "ENROLLED_ONLY" && (
                          <span className="inline-flex items-center gap-1 text-primary font-bold text-[11px]">
                            <Lock className="size-3" />
                            <span>Enrolled</span>
                          </span>
                        )}
                        {lec.visibility === "SCHEDULED" && (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                            <Calendar className="size-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {lec.visibility === "PRIVATE" && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground font-bold text-[11px]">
                            <AlertCircle className="size-3" />
                            <span>Private</span>
                          </span>
                        )}
                      </td>

                      {/* Column 3: Course Curriculum */}
                      <td className="py-3 px-3">
                        <div className="grid leading-tight">
                          <span className="font-semibold text-foreground text-[11px] truncate max-w-[180px]">
                            {lec.courseTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {lec.moduleTitle}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Date */}
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {lec.createdAt}
                      </td>

                      {/* Column 5: Views */}
                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        {lec.viewsCount.toLocaleString()}
                      </td>

                      {/* Column 6: Doubts */}
                      <td className="py-3 px-3 text-right">
                        <Link
                          href="/community"
                          className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>{lec.doubtsCount}</span>
                        </Link>
                      </td>

                      {/* Column 7: Completion Rate */}
                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        {lec.completionRate}%
                      </td>

                      {/* Column 8: Rating */}
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {lec.rating} ★
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: LIVE STREAMS & WEBINARS (YOUTUBE STUDIO LIVE CONTROL ROOM)      */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground font-sans flex items-center gap-2">
                <Radio className="size-4 text-rose-500" />
                <span>Live Broadcasts & Cohort Office Hours</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage your real-time OBS/RTMP streaming sessions and student Q&A desks.
              </p>
            </div>

            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLiveStream(liveStreams[0])
                  setIsLiveModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Radio className="size-3.5" />
                <span>Enter Live Control Room</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveStreams.map((st) => (
              <div
                key={st.id}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs space-y-3 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="relative aspect-video w-36 rounded-xl bg-zinc-950 overflow-hidden shrink-0 border border-border">
                    <img src={st.thumbnailUrl} alt={st.title} className="size-full object-cover" />
                    {st.status === "LIVE_NOW" ? (
                      <span className="absolute top-2 left-2 flex items-center gap-1 bg-rose-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase shadow-md">
                        <span className="size-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE</span>
                      </span>
                    ) : (
                      <span className="absolute top-2 left-2 bg-black/80 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-xs line-clamp-2">{st.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{st.description}</p>
                    <div className="text-[10px] text-primary font-semibold">{st.courseTitle}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    {st.status === "LIVE_NOW" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <Eye className="size-3.5" />
                        <span>{st.currentViewers} watching now</span>
                      </span>
                    ) : (
                      <span>Scheduled: {st.scheduledStartTime}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLiveStream(st)
                      setIsLiveModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Manage Stream</span>
                    <ExternalLink className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: COURSES & CURRICULA TRACKS                                      */}
      {/* ========================================================================= */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground font-sans">Authored Tracks & Curricula</h3>
              <p className="text-xs text-muted-foreground">Manage course playlists, sandboxes, and student enrollments</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingCourse(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Create New Track</span>
            </button>
          </div>

          <div className="space-y-3">
            {courses.map((c: any) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/80 bg-card p-4 gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold">
                      {c.status || "PUBLISHED"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.total_lessons || 24} Lessons • Level: {c.level || "Intermediate"} • Enrolled: {(c.enrolled_count || 1200).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/courses/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1"
                  >
                    <span>Preview</span>
                    <ExternalLink className="size-3" />
                  </Link>
                  <Link
                    href={`/community?channel=comm-fullstack`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary/80"
                  >
                    <MessageSquare className="size-3 text-primary" />
                    <span>Community</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALS                                                                 */}
      {/* ========================================================================= */}
      <LectureUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        courses={courses}
        onUploadComplete={handleLectureUpload}
      />

      <LiveControlRoomModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        stream={selectedLiveStream}
      />

    </div>
  )
}
