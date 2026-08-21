"use client"

import React from "react"
import {
  CommunityChannel,
  COMMUNITY_TYPE_CONFIG,
} from "@/types/community"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Users,
  Pin,
  Lock,
  Globe,
  GraduationCap,
  VolumeX,
  Sparkles,
  BookOpen,
  HelpCircle,
  Megaphone,
  MessageCircle,
} from "lucide-react"

interface CommunityCardProps {
  channel: CommunityChannel
  isActive: boolean
  onClick: () => void
}

export function CommunityCard({ channel, isActive, onClick }: CommunityCardProps) {
  const typeConfig = COMMUNITY_TYPE_CONFIG[channel.type] || COMMUNITY_TYPE_CONFIG.COURSE_CHANNEL

  // Icon corresponding to the community type
  const getTypeIcon = () => {
    switch (channel.type) {
      case "COURSE_CHANNEL":
        return <BookOpen className="size-3" />
      case "ANNOUNCEMENT_ONLY":
        return <Megaphone className="size-3" />
      case "STUDY_GROUP":
        return <Users className="size-3" />
      case "DOUBT_SOLVING":
        return <HelpCircle className="size-3" />
      case "GENERAL_LOUNGE":
        return <Sparkles className="size-3" />
      case "DIRECT_CHAT":
        return <MessageCircle className="size-3" />
      default:
        return <BookOpen className="size-3" />
    }
  }

  // Get initial letters for avatar
  const getInitials = (text: string) => {
    return text
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "group relative flex items-start gap-3 w-full p-3 rounded-xl transition-all duration-150 text-left cursor-pointer border select-none",
        isActive
          ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/30 dark:bg-primary/15"
          : "bg-card/70 border-border/60 hover:bg-secondary/70 hover:border-border"
      )}
    >
      {/* LEFT: Channel Avatar with Linear Gradient & Online Status */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl bg-linear-to-br text-white font-bold text-xs shadow-xs transition-transform group-hover:scale-105",
            channel.bannerColor || "from-blue-600 to-indigo-700"
          )}
        >
          {channel.avatar ? (
            <img
              src={channel.avatar}
              alt={channel.title}
              className="size-full rounded-xl object-cover"
            />
          ) : (
            <span>{getInitials(channel.title)}</span>
          )}
        </div>

        {/* Online Presence Pill or Type Indicator */}
        {channel.onlineCount > 0 && (
          <span
            title={`${channel.onlineCount} members online`}
            className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs"
          />
        )}
      </div>

      {/* RIGHT: Metadata & Last Message */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Row 1: Title + Timestamp */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              className={cn(
                "text-xs sm:text-sm font-bold tracking-tight truncate font-sans",
                isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
              )}
            >
              {channel.title}
            </h4>
            {channel.verified && (
              <CheckCircle2 className="size-3.5 text-primary shrink-0 fill-primary/20" />
            )}
            {channel.isMuted && (
              <VolumeX className="size-3 text-muted-foreground/60 shrink-0" />
            )}
          </div>

          <span className="text-[10px] text-muted-foreground/80 shrink-0 whitespace-nowrap">
            {channel.lastMessage?.timestamp || "Active"}
          </span>
        </div>

        {/* Row 2: Community Type Badge & Course Association Tag */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {/* Explicit Community Type Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[9px] font-semibold border tracking-tight",
              typeConfig.badgeColor
            )}
          >
            {getTypeIcon()}
            <span>{typeConfig.label}</span>
          </span>

          {/* Access Tag (Public / Free / Enrolled) */}
          {channel.isPublic && channel.isFreeAccessible ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 text-[9px] font-medium">
              <Globe className="size-2.5" />
              <span>Public Free</span>
            </span>
          ) : channel.courseId ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-1 py-0.2 text-[9px] font-medium">
              <GraduationCap className="size-2.5" />
              <span>Course Enrolled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-1 py-0.2 text-[9px] font-medium">
              <Lock className="size-2.5" />
              <span>Restricted</span>
            </span>
          )}
        </div>

        {/* Row 3: Last Message Snippet + Unread / Pin Badge */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
            {channel.lastMessage ? (
              <>
                <span className="font-semibold text-foreground/80">
                  {channel.lastMessage.senderName}:{" "}
                </span>
                <span>{channel.lastMessage.text}</span>
              </>
            ) : (
              channel.description
            )}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {channel.isPinned && (
              <Pin className="size-3 text-muted-foreground/70 fill-muted-foreground/30 -rotate-45" />
            )}

            {channel.unreadCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[9px] shadow-xs">
                {channel.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
