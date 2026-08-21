"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Hash,
  Volume2,
  Lock,
  Megaphone,
  BookOpen,
  HelpCircle,
  Plus,
  Search,
  UserPlus,
  Users,
  Shield,
  Award,
  Pin,
  Smile,
  Paperclip,
  Send,
  Mic,
  MoreVertical,
  Check,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Radio,
  Copy,
  Info,
  CheckCheck,
} from "lucide-react"
import {
  CommunityChannel,
  CommunityMessage,
  DiscordCategory,
  FacultyAssignee,
} from "@/types/community"
import { useCommunity } from "@/hooks/useCommunity"
import { TeacherInvitationModal } from "@/components/institution/teacher-invitation-modal"
import { CreateChannelModal } from "@/components/institution/create-channel-modal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DiscordCommunityViewProps {
  institution: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    role?: string
  }
  courses?: { id: string; title: string; level?: string }[]
}

const CATEGORY_ORDER: { id: DiscordCategory; label: string; icon: React.ElementType }[] = [
  { id: "ANNOUNCEMENTS", label: "ANNOUNCEMENTS", icon: Megaphone },
  { id: "COURSE_CHANNELS", label: "COURSE CHANNELS", icon: BookOpen },
  { id: "DOUBT_DESKS", label: "DOUBT & STUDY DESKS", icon: HelpCircle },
  { id: "FACULTY_ONLY", label: "FACULTY & STAFF ONLY", icon: Lock },
  { id: "VOICE_ROOMS", label: "VOICE & OFFICE HOURS", icon: Volume2 },
]

export function DiscordCommunityView({
  institution,
  courses = [
    { id: "c1", title: "Full-Stack Web Development & Microservices Mastery" },
    { id: "c2", title: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)" },
    { id: "c3", title: "Distributed Systems & Cloud DevOps Engineering" },
  ],
}: DiscordCommunityViewProps) {
  const {
    allChannels,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    activeMessages,
    sendMessage,
    toggleReaction,
    togglePinMessage,
    createChannel,
    assignTeacherToChannel,
    removeTeacherFromChannel,
  } = useCommunity()

  const [inputMessage, setInputMessage] = useState("")
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [targetCategoryForCreate, setTargetCategoryForCreate] = useState<DiscordCategory>("COURSE_CHANNELS")
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
  const [showRightDetails, setShowRightDetails] = useState(true)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const currentUserRole = (institution.role || "OWNER").toUpperCase()
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(currentUserRole)

  // Categorize Channels
  const categorizedChannels = useMemo(() => {
    const map: Record<string, CommunityChannel[]> = {
      ANNOUNCEMENTS: [],
      COURSE_CHANNELS: [],
      DOUBT_DESKS: [],
      FACULTY_ONLY: [],
      VOICE_ROOMS: [],
    }

    allChannels.forEach((ch) => {
      // RBAC: If channel is FACULTY_ONLY and user is STUDENT, hide it
      if (ch.category === "FACULTY_ONLY" && currentUserRole === "STUDENT") {
        return
      }
      const cat = ch.category || "COURSE_CHANNELS"
      if (!map[cat]) {
        map[cat] = []
      }
      map[cat].push(ch)
    })

    return map
  }, [allChannels, currentUserRole])

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const openCreateForCategory = (cat: DiscordCategory, e: React.MouseEvent) => {
    e.stopPropagation()
    setTargetCategoryForCreate(cat)
    setIsCreateModalOpen(true)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    sendMessage(inputMessage)
    setInputMessage("")
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    toast.success("Code snippet copied to clipboard!")
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  return (
    <div className="w-full max-w-full flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* 3-Column Discord Body */}
      <div className="flex flex-1 min-h-0 min-w-0 max-w-full overflow-hidden">
        
        {/* ========================================================================= */}
        {/* PANE 1: DISCORD CHANNEL TREE SIDEBAR                                      */}
        {/* ========================================================================= */}
        <div className="w-52 sm:w-56 md:w-60 bg-sidebar/70 border-r border-border/60 flex flex-col shrink-0 select-none overflow-hidden">
          {/* Server / Institution Channel Header */}
          <div className="h-12 border-b border-border/60 px-3.5 flex items-center justify-between shrink-0 bg-sidebar/90">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-[10px] shadow-xs shrink-0">
                {institution.name?.slice(0, 2).toUpperCase() || "OI"}
              </div>
              <span className="font-bold text-foreground font-sans text-xs truncate">
                {institution.name}
              </span>
            </div>
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setTargetCategoryForCreate("COURSE_CHANNELS")
                  setIsCreateModalOpen(true)
                }}
                title="Create Channel"
                className="size-6 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
              </button>
            )}
          </div>

          <div className="p-2 space-y-4 overflow-y-auto no-scrollbar flex-1">
            {CATEGORY_ORDER.map((cat) => {
              const channelsInCat = categorizedChannels[cat.id] || []
              const isCollapsed = collapsedCategories[cat.id]

              // Hide Faculty category if user is a student
              if (cat.id === "FACULTY_ONLY" && currentUserRole === "STUDENT") {
                return null
              }

              return (
                <div key={cat.id} className="space-y-1">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase hover:text-foreground cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isCollapsed ? (
                        <ChevronRight className="size-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-3 text-muted-foreground" />
                      )}
                      <span className="truncate">{cat.label}</span>
                    </div>

                    {/* "+" Add Channel Button (Only for Owners/Admins) */}
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={(e) => openCreateForCategory(cat.id, e)}
                        title={`Create channel in ${cat.label}`}
                        className="opacity-0 group-hover:opacity-100 size-4 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>

                  {/* Channel List */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1">
                      {channelsInCat.length === 0 ? (
                        <div className="px-2 py-1 text-[11px] text-muted-foreground/60 italic">
                          No channels in category
                        </div>
                      ) : (
                        channelsInCat.map((ch) => {
                          const isActive = ch.id === activeChannelId
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => setActiveChannelId(ch.id)}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group/ch",
                                isActive
                                  ? "bg-primary/15 text-primary font-bold shadow-2xs border border-primary/20"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {ch.isVoice ? (
                                  <Volume2 className={cn("size-3.5 shrink-0", isActive ? "text-emerald-400" : "text-muted-foreground")} />
                                ) : ch.category === "FACULTY_ONLY" ? (
                                  <Lock className={cn("size-3.5 shrink-0", isActive ? "text-rose-400" : "text-muted-foreground")} />
                                ) : ch.category === "ANNOUNCEMENTS" ? (
                                  <Megaphone className={cn("size-3.5 shrink-0", isActive ? "text-indigo-400" : "text-muted-foreground")} />
                                ) : (
                                  <Hash className={cn("size-3.5 shrink-0", isActive ? "text-primary font-bold" : "text-muted-foreground")} />
                                )}
                                <span className="truncate">{ch.title}</span>
                              </div>

                              {/* Channel Status Indicators */}
                              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                {ch.assignedFaculty && ch.assignedFaculty.length > 0 && (
                                  <div
                                    title={`${ch.assignedFaculty.length} educators assigned`}
                                    className="flex -space-x-1 overflow-hidden"
                                  >
                                    {ch.assignedFaculty.slice(0, 2).map((f) => (
                                      <div
                                        key={f.id}
                                        className="size-4 rounded-full bg-primary/20 text-[8px] flex items-center justify-center font-bold border border-background text-primary"
                                      >
                                        {f.name.slice(0, 1)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {ch.unreadCount > 0 && (
                                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[9px]">
                                    {ch.unreadCount}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* User Status Bar at bottom of sidebar */}
          <div className="p-2.5 bg-sidebar border-t border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                SC
              </div>
              <div className="grid leading-tight min-w-0">
                <span className="font-bold text-foreground text-xs truncate">Dr. Sarah Chen</span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Online • {currentUserRole}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE 2: ACTIVE DISCORD CHAT AREA                                          */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          
          {/* Channel Top Header */}
          <div className="h-12 border-b border-border/60 px-4 flex items-center justify-between shrink-0 bg-card/40 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeChannel.isVoice ? (
                <Volume2 className="size-4 text-emerald-400 shrink-0" />
              ) : activeChannel.category === "FACULTY_ONLY" ? (
                <Lock className="size-4 text-rose-400 shrink-0" />
              ) : (
                <Hash className="size-4 text-primary shrink-0" />
              )}
              <span className="font-bold text-foreground text-sm font-sans truncate">
                {activeChannel.title}
              </span>
              <span className="text-muted-foreground/50 hidden sm:inline">|</span>
              <span className="text-xs text-muted-foreground truncate hidden sm:inline max-w-md">
                {activeChannel.description}
              </span>
            </div>

            {/* Right Header Badges & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeChannel.courseId && (
                <Link
                  href={`/courses/${activeChannel.courseId}`}
                  className="hidden md:inline-flex items-center gap-1 rounded-md bg-secondary/80 hover:bg-secondary px-2 py-1 text-[11px] font-semibold text-primary transition-colors"
                >
                  <BookOpen className="size-3" />
                  <span className="truncate max-w-[120px]">{activeChannel.courseTitle || "Linked Course"}</span>
                  <ExternalLink className="size-2.5 opacity-60" />
                </Link>
              )}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                <Users className="size-3 text-emerald-500" />
                <span>{activeChannel.onlineCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRightDetails(!showRightDetails)}
                title={showRightDetails ? "Hide Channel Details" : "Show Channel Details"}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center",
                  showRightDetails
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                )}
              >
                <Info className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Pinned Announcement Banner (if any) */}
          {activeChannel.pinnedMessage && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-primary shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Pin className="size-3.5 text-primary shrink-0 rotate-45" />
                <span className="font-bold shrink-0">Pinned:</span>
                <span className="truncate text-foreground text-xs">{activeChannel.pinnedMessage.content}</span>
              </div>
              <button
                type="button"
                onClick={() => togglePinMessage(activeChannel.pinnedMessage!.id)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold shrink-0 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Voice Channel Interactive Stage (If Voice Room) */}
          {activeChannel.isVoice ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-zinc-950/80 text-center space-y-6">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-2xl relative">
                <Volume2 className="size-10 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black animate-ping" />
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-black text-foreground font-sans">
                  {activeChannel.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Live voice office hours for interactive TA debugging, student sandbox reviews, and 1-on-1 coding mentorship.
                </p>
              </div>

              {/* Active Participants Avatars */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative size-14 rounded-2xl bg-primary/20 border-2 border-emerald-500 flex items-center justify-center text-primary font-bold text-sm shadow-lg">
                    KP
                    <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Kavya Patel (TA)</span>
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase">Speaking 🎙️</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative size-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-bold text-sm">
                    DV
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Devon Vance</span>
                  <span className="text-[9px] text-muted-foreground font-medium">Listening</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative size-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-bold text-sm">
                    MR
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Maya Ray</span>
                  <span className="text-[9px] text-muted-foreground font-medium">Listening</span>
                </div>
              </div>

              {/* Voice Action Bar */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceActive(!isVoiceActive)
                    toast.success(isVoiceActive ? "Disconnected from Voice Room." : "Connected to Live Office Hours Voice!")
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2",
                    isVoiceActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <Radio className="size-4" />
                  <span>{isVoiceActive ? "Disconnect Voice" : "Join Voice Room"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Text Message Stream */
            <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
              {activeMessages.map((msg: CommunityMessage) => {
                const isAuthorOwnerOrInstructor = ["OWNER", "INSTRUCTOR", "INSTITUTION_ADMIN"].includes(msg.senderRole)
                const isTA = msg.senderRole === "TA"

                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-card/60 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="flex size-9 items-center justify-center rounded-xl bg-secondary font-bold text-xs text-foreground shrink-0 overflow-hidden border border-border mt-0.5">
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt={msg.senderName} className="size-full object-cover" />
                      ) : (
                        <span>{msg.senderName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="grid flex-1 leading-tight min-w-0 space-y-1">
                      {/* Sender Info & Role Tag */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{msg.senderName}</span>
                        
                        {isAuthorOwnerOrInstructor && (
                          <span className="px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase">
                            FACULTY
                          </span>
                        )}
                        {isTA && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase">
                            TA
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground">{msg.createdAt}</span>
                      </div>

                      {/* Message Content */}
                      <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Code Block Snippet (if contentType is code) */}
                      {msg.contentType === "code" && (
                        <div className="mt-2 rounded-xl border border-border bg-zinc-950 p-3 relative font-mono text-[11px] text-emerald-400 overflow-x-auto max-w-full">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(msg.content, msg.id)}
                            className="absolute right-2 top-2 rounded-md bg-secondary/80 hover:bg-secondary p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCodeId === msg.id ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          </button>
                          <pre className="overflow-x-auto whitespace-pre-wrap break-words">{msg.content}</pre>
                        </div>
                      )}

                      {/* Emoji Reactions Bar */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {msg.reactions.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleReaction(msg.id, r.emoji)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                                r.hasReacted
                                  ? "bg-primary/20 border-primary text-primary"
                                  : "bg-secondary/60 border-border text-muted-foreground hover:bg-secondary"
                              )}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Message Input Box */}
          {!activeChannel.isVoice && (
            <div className="p-3 border-t border-border/60 bg-card/40 backdrop-blur-xs">
              <form onSubmit={handleSendMessage} className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                  <span>
                    Posting as <strong className="text-primary font-semibold">Dr. Sarah Chen ({currentUserRole})</strong>
                  </span>
                  <span>Markdown & Code format supported</span>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 focus-within:border-primary transition-colors">
                  <button
                    type="button"
                    title="Add Attachment"
                    onClick={() => toast.info("Attachment upload dialog opened.")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Paperclip className="size-4" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Message #${activeChannel.title}...`}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-sans"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Send className="size-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* PANE 3: CHANNEL DETAILS & FACULTY ASSIGNMENT PANEL                         */}
        {/* ========================================================================= */}
        {showRightDetails && (
          <div className="w-56 lg:w-60 xl:w-64 bg-sidebar/50 border-l border-border/60 p-3.5 space-y-4 overflow-y-auto no-scrollbar shrink-0 text-xs">
            
            {/* Section 1: Channel Overview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <h4 className="font-bold text-foreground font-sans uppercase tracking-wider text-[11px]">
                  Channel Details
                </h4>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {activeChannel.description}
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  {activeChannel.accessLevel}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                  {activeChannel.category}
                </span>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Section 2: Channel Lead & Assigned Educators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground font-sans uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="size-3.5 text-primary" />
                  <span>Channel Faculty</span>
                </h4>
                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsTeacherModalOpen(true)}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Assign</span>
                  </button>
                )}
              </div>

              {/* Channel Lead */}
              {activeChannel.channelLead && (
                <div className="p-2.5 rounded-xl bg-background border border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {activeChannel.channelLead.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="grid leading-tight min-w-0">
                      <span className="font-bold text-xs text-foreground truncate">
                        {activeChannel.channelLead.name}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-semibold">Lead Educator</span>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                    {activeChannel.channelLead.role}
                  </span>
                </div>
              )}

              {/* Assigned Faculty & TAs */}
              {activeChannel.assignedFaculty && activeChannel.assignedFaculty.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Additional Assigned Teachers & TAs:
                  </span>
                  {activeChannel.assignedFaculty.map((f) => (
                    <div
                      key={f.id}
                      className="p-2 rounded-xl bg-card border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-6 rounded-lg bg-secondary text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                          {f.name.slice(0, 1)}
                        </div>
                        <div className="grid leading-tight min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate">{f.name}</span>
                          <span className="text-[9px] text-muted-foreground">{f.email}</span>
                        </div>
                      </div>

                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => removeTeacherFromChannel(activeChannel.id, f.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Remove from channel"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border/80 text-center space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">No additional faculty assigned to this channel yet.</p>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      <UserPlus className="size-3" />
                      <span>Assign Teacher</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="h-px bg-border/60" />

            {/* Section 3: Connected Course & Enrollment Sync */}
            {activeChannel.courseId && (
              <div className="space-y-2">
                <h4 className="font-bold text-foreground font-sans uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-primary" />
                  <span>Curriculum Sync</span>
                </h4>
                <div className="p-3 rounded-xl bg-background border border-border space-y-1.5">
                  <div className="font-bold text-foreground text-xs">{activeChannel.courseTitle}</div>
                  <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCheck className="size-3 text-emerald-500" />
                    <span>Enrolled students automatically synced ({activeChannel.memberCount} members)</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TEACHER INVITATION & ASSIGNMENT                                   */}
      {/* ========================================================================= */}
      <TeacherInvitationModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        channel={activeChannel}
        onAssignTeacher={(teacher) => assignTeacherToChannel(activeChannel.id, teacher)}
        onRemoveTeacher={(teacherId) => removeTeacherFromChannel(activeChannel.id, teacherId)}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE CHANNEL MODAL                                             */}
      {/* ========================================================================= */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialCategory={targetCategoryForCreate}
        courses={courses}
        onCreateChannel={createChannel}
      />

    </div>
  )
}
