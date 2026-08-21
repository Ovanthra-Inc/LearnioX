"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  CommunityChannel,
  COMMUNITY_TYPE_CONFIG,
} from "@/types/community"
import {
  X,
  CheckCircle2,
  Users,
  BookOpen,
  ArrowUpRight,
  Shield,
  FileText,
  Code2,
  Link2,
  Image as ImageIcon,
  Copy,
  Bell,
  BellOff,
  LogOut,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Scale,
  Lock,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ChannelProfileDrawerProps {
  channel: CommunityChannel
  isOpen: boolean
  onClose: () => void
  onToggleMute: () => void
  onLeaveChannel: () => void
}

export function ChannelProfileDrawer({
  channel,
  isOpen,
  onClose,
  onToggleMute,
  onLeaveChannel,
}: ChannelProfileDrawerProps) {
  const [activeMediaTab, setActiveMediaTab] = useState<"rules" | "files" | "members" | "links">("rules")
  const typeConfig = COMMUNITY_TYPE_CONFIG[channel.type] || COMMUNITY_TYPE_CONFIG.COURSE_CHANNEL

  if (!isOpen) return null

  const getInitials = (text: string) => {
    return text
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/community?channel=${channel.id}`)
      toast.success("Community invite link copied to clipboard!")
    }
  }

  // Sample members list for directory
  const SAMPLE_MEMBERS = [
    {
      id: "m1",
      name: "Dr. Sarah Chen",
      role: "INSTRUCTOR",
      title: "Lead Systems Architect & Instructor",
      isOnline: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: "m2",
      name: "Kavya Patel",
      role: "TA",
      title: "Teaching Assistant (FastAPI & DB)",
      isOnline: true,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: "m3",
      name: "Marcus Aurelius",
      role: "INSTITUTION_ADMIN",
      title: "Ovanthra Academic Dean",
      isOnline: false,
    },
    {
      id: "m4",
      name: "Devon Vance",
      role: "STUDENT",
      title: "Peer Student",
      isOnline: true,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <aside className="relative z-50 flex flex-col w-full max-w-md h-full bg-background border-l border-border shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Top Floating Close Button */}
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground/80 hover:bg-secondary hover:text-foreground border border-border shadow-xs transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 1. Header Banner & Profile Avatar */}
        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent border-b border-border/60 text-center">
          {/* Avatar */}
          <div className="relative mx-auto size-20 mb-3">
            <div
              className={cn(
                "flex size-full items-center justify-center rounded-2xl bg-linear-to-br text-white font-black text-xl shadow-lg border-2 border-background ring-4 ring-primary/20",
                channel.bannerColor || "from-blue-600 to-indigo-700"
              )}
            >
              {channel.avatar ? (
                <img
                  src={channel.avatar}
                  alt={channel.title}
                  className="size-full rounded-2xl object-cover"
                />
              ) : (
                <span>{getInitials(channel.title)}</span>
              )}
            </div>
            {channel.onlineCount > 0 && (
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 ring-3 ring-background shadow-xs" />
            )}
          </div>

          {/* Title & Verified */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight font-sans">
              {channel.title}
            </h2>
            {channel.verified && (
              <CheckCircle2 className="size-4 text-primary fill-primary/20 shrink-0" />
            )}
          </div>

          {/* Stats: Members & Online */}
          <p className="text-xs text-muted-foreground mb-3">
            <strong className="text-foreground font-semibold">
              {channel.memberCount.toLocaleString()}
            </strong>{" "}
            members •{" "}
            <span className="text-emerald-500 font-medium">
              {channel.onlineCount} online
            </span>
          </p>

          {/* Type Badge + Access Pill */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                typeConfig.badgeColor
              )}
            >
              <span>{typeConfig.label}</span>
            </span>

            {channel.isPublic && channel.isFreeAccessible ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium">
                <Globe className="size-3" />
                <span>Public & Free</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-0.5 text-[10px] font-medium">
                <Lock className="size-3" />
                <span>Enrolled Only</span>
              </span>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs"
            >
              <Copy className="size-3.5 text-primary" />
              <span>Share Link</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs",
                channel.isMuted
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              )}
            >
              {channel.isMuted ? (
                <>
                  <BellOff className="size-3.5" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Bell className="size-3.5 text-muted-foreground" />
                  <span>Mute</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Associated Course Connection Card (if applicable) */}
          {channel.courseId && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Connected Course
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {channel.courseLevel || "Curriculum"}
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground line-clamp-1">
                {channel.courseTitle || "Course Curriculum"}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                All lectures, assignments, and test updates are synced to this community.
              </p>
              <Link
                href={`/courses/${channel.courseId}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
              >
                <span>Go to Course Curriculum</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          )}

          {/* Description & Bio */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">
              About Channel
            </h4>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {channel.description}
            </p>
            {channel.institutionName && (
              <p className="text-[11px] text-muted-foreground pt-1">
                Managed by{" "}
                <span className="font-semibold text-foreground">
                  {channel.institutionName}
                </span>
              </p>
            )}
          </div>

          {/* Tab Selection: Rules & Regulations, Files, Members */}
          <div className="space-y-3">
            <div className="flex items-center border-b border-border text-xs">
              <button
                type="button"
                onClick={() => setActiveMediaTab("rules")}
                className={cn(
                  "pb-2 font-semibold transition-colors relative cursor-pointer px-3",
                  activeMediaTab === "rules"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Rules & Conduct
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("files")}
                className={cn(
                  "pb-2 font-semibold transition-colors relative cursor-pointer px-3",
                  activeMediaTab === "files"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Shared Files
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("members")}
                className={cn(
                  "pb-2 font-semibold transition-colors relative cursor-pointer px-3",
                  activeMediaTab === "members"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Members ({channel.memberCount})
              </button>
            </div>

            {/* TAB CONTENT 1: Telegram Channel Rules & Regulations */}
            {activeMediaTab === "rules" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Scale className="size-4 text-primary" />
                  <span>Channel Rules & Academic Guidelines</span>
                </div>

                {channel.rules && channel.rules.length > 0 ? (
                  <div className="space-y-2">
                    {channel.rules.map((rule, idx) => (
                      <div
                        key={rule.id || idx}
                        className="rounded-xl border border-border/80 bg-card/60 p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-foreground">
                            {rule.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-muted-foreground pl-6">
                          {rule.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground space-y-1">
                    <p>• Standard institution academic conduct applies.</p>
                    <p>• No spam or unauthorized promotional links.</p>
                    <p>• Respectful developer collaboration.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Shared Files & Resources */}
            {activeMediaTab === "files" && (
              <div className="space-y-2 pt-1">
                <div className="rounded-xl border border-border/80 bg-card/60 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <h6 className="text-xs font-semibold text-foreground line-clamp-1">
                        LearnioX_Microservices_Architecture_Specs_v2.pdf
                      </h6>
                      <span className="text-[10px] text-muted-foreground">4.8 MB • PDF</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Downloading file...")}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Download
                  </button>
                </div>

                <div className="rounded-xl border border-border/80 bg-card/60 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Code2 className="size-4" />
                    </div>
                    <div>
                      <h6 className="text-xs font-semibold text-foreground line-clamp-1">
                        database_session.py
                      </h6>
                      <span className="text-[10px] text-muted-foreground">1.4 KB • Python Code</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Opening code viewer...")}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Member Directory */}
            {activeMediaTab === "members" && (
              <div className="space-y-2 pt-1">
                {SAMPLE_MEMBERS.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="flex size-8 items-center justify-center rounded-full bg-secondary font-bold text-xs text-foreground overflow-hidden">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            getInitials(member.name)
                          )}
                        </div>
                        {member.isOnline && (
                          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground font-sans">
                            {member.name}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1 py-0.2 text-[9px] font-semibold uppercase",
                              member.role === "INSTRUCTOR"
                                ? "bg-amber-500/15 text-amber-400"
                                : member.role === "TA"
                                ? "bg-purple-500/15 text-purple-400"
                                : member.role === "INSTITUTION_ADMIN"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {member.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {member.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* 3. Bottom Footer Action (Leave Channel) */}
        <div className="p-4 border-t border-border/60 bg-card/30">
          <button
            type="button"
            onClick={onLeaveChannel}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Leave Community Channel</span>
          </button>
        </div>

      </aside>
    </div>
  )
}
