"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  CommunityChannel,
  CommunityMessage,
  COMMUNITY_TYPE_CONFIG,
  MessageAttachment,
} from "@/types/community"
import {
  Search,
  MoreVertical,
  Pin,
  Paperclip,
  Smile,
  Send,
  Mic,
  Check,
  CheckCheck,
  CheckCircle2,
  Code2,
  FileText,
  Copy,
  ChevronDown,
  Info,
  Bell,
  BellOff,
  LogOut,
  Trash2,
  ShieldAlert,
  GraduationCap,
  ArrowUpRight,
  Sparkles,
  Volume2,
  X,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TelegramChatAreaProps {
  channel: CommunityChannel
  messages: CommunityMessage[]
  onSendMessage: (
    content: string,
    options?: {
      contentType?: "text" | "code" | "file" | "announcement" | "audio"
      language?: string
      attachments?: MessageAttachment[]
      replyTo?: { id: string; senderName: string; content: string }
    }
  ) => void
  onToggleReaction: (messageId: string, emoji: string) => void
  onTogglePinMessage: (messageId: string) => void
  onJoinChannel: (channelId: string) => void
  onLeaveChannel: (channelId: string) => void
  onToggleMute: (channelId: string) => void
  onClearHistory: (channelId: string) => void
  onBlockOrReport: (channelId: string) => void
  onOpenProfileDrawer: () => void
}

const COMMON_REACTIONS = ["👍", "🔥", "🚀", "💡", "❤️", "🎉", "👏", "🎯"]

export function TelegramChatArea({
  channel,
  messages,
  onSendMessage,
  onToggleReaction,
  onTogglePinMessage,
  onJoinChannel,
  onLeaveChannel,
  onToggleMute,
  onClearHistory,
  onBlockOrReport,
  onOpenProfileDrawer,
}: TelegramChatAreaProps) {
  const [inputText, setInputText] = useState("")
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // messageId or 'composer'
  const [showInChatSearch, setShowInChatSearch] = useState(false)
  const [inChatSearchQuery, setInChatSearchQuery] = useState("")
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const typeConfig = COMMUNITY_TYPE_CONFIG[channel.type] || COMMUNITY_TYPE_CONFIG.COURSE_CHANNEL

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, channel.id])

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThreeDotMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSend = () => {
    if (!inputText.trim()) return
    onSendMessage(inputText, {
      replyTo: replyingTo || undefined,
    })
    setInputText("")
    setReplyingTo(null)
    setShowEmojiPicker(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceRecordToggle = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true)
      toast.info("Voice note recording started... Click again to send.")
    } else {
      setIsRecordingVoice(false)
      onSendMessage("🎙️ Voice Note (0:18)", {
        contentType: "audio",
        attachments: [
          {
            id: `audio-${Date.now()}`,
            type: "audio",
            title: "Voice_Recording_18s.mp3",
            url: "#",
            size: "240 KB",
          },
        ],
      })
      toast.success("Voice note sent!")
    }
  }

  const handleCopyCode = (code: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard!")
    }
  }

  const getInitials = (text: string) => {
    return text
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  // Filter messages if search inside chat is active
  const filteredMessages = inChatSearchQuery
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(inChatSearchQuery.toLowerCase())
      )
    : messages

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Telegram Style with Avatar, Course Link, Stats & 3-Dot)    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/80 bg-card/60 backdrop-blur-md z-20">
        
        {/* Left: Community Avatar & Header Click Target (Opens Profile Drawer) */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenProfileDrawer}
          className="flex items-center gap-3 cursor-pointer group select-none min-w-0 pr-2"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl bg-linear-to-br text-white font-bold text-xs shadow-xs transition-transform group-hover:scale-105",
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
            {channel.onlineCount > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>

          {/* Title & Metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate font-sans">
                {channel.title}
              </h3>
              {channel.verified && (
                <CheckCircle2 className="size-3.5 text-primary fill-primary/20 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
              {channel.courseTitle ? (
                <span className="text-primary font-medium truncate max-w-[200px] sm:max-w-[280px]">
                  {channel.courseTitle}
                </span>
              ) : (
                <span>{typeConfig.label}</span>
              )}
              <span>•</span>
              <span>{channel.memberCount.toLocaleString()} members</span>
              <span className="hidden sm:inline text-emerald-500 font-medium">
                ({channel.onlineCount} online)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Search, Mute, Info, 3-Dot Dropdown) */}
        <div className="flex items-center gap-1 shrink-0 relative" ref={menuRef}>
          
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowInChatSearch((prev) => !prev)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer",
              showInChatSearch && "bg-secondary text-primary"
            )}
            title="Search in conversation"
          >
            <Search className="size-4" />
          </button>

          {/* Notification Mute Toggle */}
          <button
            type="button"
            onClick={() => onToggleMute(channel.id)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title={channel.isMuted ? "Unmute notifications" : "Mute notifications"}
          >
            {channel.isMuted ? (
              <BellOff className="size-4 text-amber-500" />
            ) : (
              <Bell className="size-4" />
            )}
          </button>

          {/* Info / Profile Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenProfileDrawer}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Channel Profile & Rules"
          >
            <Info className="size-4" />
          </button>

          {/* 3-DOT MENU BUTTON (Per Chat Corner) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThreeDotMenu((prev) => !prev)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer",
                showThreeDotMenu && "bg-secondary text-foreground"
              )}
              title="More options"
            >
              <MoreVertical className="size-4" />
            </button>

            {/* 3-DOT POPUP DROPDOWN (Requested by User) */}
            {showThreeDotMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 select-none">
                {/* 1. View Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setShowThreeDotMenu(false)
                    onOpenProfileDrawer()
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Info className="size-3.5 text-primary" />
                  <span>Channel Profile & Rules</span>
                </button>

                {/* 2. Mute Notifications */}
                <button
                  type="button"
                  onClick={() => {
                    setShowThreeDotMenu(false)
                    onToggleMute(channel.id)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  {channel.isMuted ? (
                    <>
                      <Bell className="size-3.5 text-emerald-400" />
                      <span>Unmute Notifications</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="size-3.5 text-muted-foreground" />
                      <span>Mute Notifications</span>
                    </>
                  )}
                </button>

                {/* 3. Clear History */}
                <button
                  type="button"
                  onClick={() => {
                    setShowThreeDotMenu(false)
                    onClearHistory(channel.id)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                  <span>Clear Chat History</span>
                </button>

                <div className="my-1 border-t border-border/60" />

                {/* 4. Leave Channel */}
                <button
                  type="button"
                  onClick={() => {
                    setShowThreeDotMenu(false)
                    onLeaveChannel(channel.id)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="size-3.5 text-destructive" />
                  <span>Leave Channel</span>
                </button>

                {/* 5. Block / Report */}
                <button
                  type="button"
                  onClick={() => {
                    setShowThreeDotMenu(false)
                    onBlockOrReport(channel.id)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer font-medium"
                >
                  <ShieldAlert className="size-3.5 text-destructive" />
                  <span>Block & Report</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* In-Chat Search Bar (Dropdown) */}
      {showInChatSearch && (
        <div className="px-4 py-2 border-b border-border/60 bg-secondary/60 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            placeholder="Search messages in this channel..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-sans"
            autoFocus
          />
          {inChatSearchQuery && (
            <button
              type="button"
              onClick={() => setInChatSearchQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowInChatSearch(false)
              setInChatSearchQuery("")
            }}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PINNED ANNOUNCEMENT BAR (Telegram Style)                               */}
      {/* ========================================================================= */}
      {channel.pinnedMessage && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs gap-3 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="size-3.5 text-primary shrink-0 -rotate-45" />
            <div className="truncate">
              <span className="font-bold text-primary mr-1.5">
                Pinned Announcement:
              </span>
              <span className="text-foreground/90 truncate">
                {channel.pinnedMessage.content.slice(0, 100)}...
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfileDrawer}
            className="text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
          >
            View Details
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TELEGRAM CHAT MESSAGE STREAM                                           */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Date Divider (Telegram Style) */}
        <div className="flex items-center justify-center my-2 select-none">
          <span className="rounded-full bg-secondary/80 border border-border/60 px-3 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-xs">
            Today
          </span>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-muted-foreground">
            <Sparkles className="size-8 text-primary/40" />
            <p className="text-xs font-semibold text-foreground">
              {inChatSearchQuery ? "No matching messages found" : "No messages yet in this channel"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              {inChatSearchQuery
                ? "Try searching for a different keyword"
                : "Be the first to say hello or ask a question!"}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === "u-current-user"

            return (
              <div
                key={msg.id}
                className={cn(
                  "group relative flex items-start gap-2.5 max-w-[92%] sm:max-w-[80%]",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Sender Avatar */}
                {!isMe && (
                  <div className="relative shrink-0 mt-0.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-secondary font-bold text-xs text-foreground overflow-hidden shadow-xs">
                      {msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(msg.senderName)}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={cn(
                    "relative flex flex-col rounded-2xl p-3 shadow-xs border transition-all text-left",
                    isMe
                      ? "bg-primary text-primary-foreground border-primary/40 rounded-tr-xs"
                      : "bg-card border-border/80 text-card-foreground rounded-tl-xs"
                  )}
                >
                  {/* Sender Header (Name + Role Badge) */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-border/40">
                      <span className="text-xs font-bold text-foreground font-sans">
                        {msg.senderName}
                      </span>
                      {msg.senderRole === "INSTRUCTOR" && (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 px-1 py-0.2 text-[9px] font-bold">
                          Instructor
                        </span>
                      )}
                      {msg.senderRole === "TA" && (
                        <span className="rounded bg-purple-500/15 border border-purple-500/30 text-purple-400 px-1 py-0.2 text-[9px] font-bold">
                          TA
                        </span>
                      )}
                      {msg.senderRole === "INSTITUTION_ADMIN" && (
                        <span className="rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 px-1 py-0.2 text-[9px] font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reply Quote preview if replying to a previous message */}
                  {msg.replyTo && (
                    <div
                      className={cn(
                        "mb-2 rounded-lg border-l-2 p-1.5 text-[11px] select-none",
                        isMe
                          ? "border-primary-foreground/80 bg-primary-foreground/10 text-primary-foreground"
                          : "border-primary bg-primary/5 text-foreground/80"
                      )}
                    >
                      <span className="font-bold block text-[10px] text-primary">
                        Replying to {msg.replyTo.senderName}
                      </span>
                      <span className="line-clamp-1 italic">
                        {msg.replyTo.content}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                    {msg.content}
                  </div>

                  {/* Attachments Section */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-xl p-2 border",
                            isMe
                              ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                              : "bg-secondary/70 border-border text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {att.type === "code" ? (
                              <Code2 className="size-4 shrink-0 text-blue-400" />
                            ) : att.type === "audio" ? (
                              <Volume2 className="size-4 shrink-0 text-emerald-400" />
                            ) : (
                              <FileText className="size-4 shrink-0 text-red-400" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {att.title}
                              </p>
                              {att.size && (
                                <span className="text-[10px] opacity-75">
                                  {att.size}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toast.info(`Accessing ${att.title}...`)}
                            className="text-xs font-bold underline px-1 cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Double Checkmarks (Telegram Style) */}
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-[10px] mt-1 select-none",
                      isMe ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    <span>{msg.createdAt}</span>
                    {isMe && (
                      <CheckCheck className="size-3.5 text-primary-foreground" />
                    )}
                  </div>

                  {/* Reaction Pills Row */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-border/30">
                      {msg.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => onToggleReaction(msg.id, r.emoji)}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-transform hover:scale-110 cursor-pointer shadow-2xs",
                            r.hasReacted
                              ? "bg-primary/20 border-primary text-primary font-bold dark:bg-primary/30"
                              : "bg-secondary/80 border-border text-foreground/80"
                          )}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Action Hover Bar (Reply, Reaction Picker, Pin) */}
                  <div
                    className={cn(
                      "absolute -top-3 hidden group-hover:flex items-center gap-1 rounded-full bg-background/90 border border-border shadow-md px-1.5 py-0.5 z-10 backdrop-blur-xs",
                      isMe ? "left-2" : "right-2"
                    )}
                  >
                    {/* Quick Reactions */}
                    {["👍", "🔥", "🚀", "💡"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onToggleReaction(msg.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}

                    <div className="w-[1px] h-3 bg-border mx-0.5" />

                    {/* Reply Action */}
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingTo({
                          id: msg.id,
                          senderName: msg.senderName,
                          content: msg.content,
                        })
                      }
                      title="Reply to message"
                      className="text-[10px] font-semibold text-muted-foreground hover:text-foreground px-1 cursor-pointer"
                    >
                      Reply
                    </button>

                    {/* Pin Action */}
                    <button
                      type="button"
                      onClick={() => onTogglePinMessage(msg.id)}
                      title="Pin message"
                      className="text-muted-foreground hover:text-primary p-0.5 cursor-pointer"
                    >
                      <Pin className="size-2.5 -rotate-45" />
                    </button>
                  </div>

                </div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ========================================================================= */}
      {/* 4. TELEGRAM COMPOSER OR "JOIN CHANNEL" CTA BAR                            */}
      {/* ========================================================================= */}
      {!channel.isJoined ? (
        // Public Free Channel Preview State: "Join Community Channel" CTA
        <div className="p-4 border-t border-border bg-card/60 backdrop-blur-md text-center space-y-2 select-none">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h4 className="text-xs sm:text-sm font-bold text-foreground">
              You are viewing a public preview of {channel.title}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            This is an open community channel for verified learners and external students.
            Join now to ask questions, chat with instructors, and download project files.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onJoinChannel(channel.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Join Community Channel</span>
            </button>
          </div>
        </div>
      ) : (
        // Joined Channel Interactive Message Composer
        <div className="p-3 sm:p-4 border-t border-border/80 bg-card/40 backdrop-blur-md space-y-2">
          
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between rounded-xl bg-secondary/80 border border-border px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-primary">
                  Replying to {replyingTo.senderName}:
                </span>
                <span className="text-muted-foreground truncate">
                  {replyingTo.content}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Quick Emoji Picker Drawer */}
          {showEmojiPicker === "composer" && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-card border border-border shadow-md animate-in fade-in select-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
                Reactions:
              </span>
              {COMMON_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + " " + emoji)
                    setShowEmojiPicker(null)
                  }}
                  className="text-base hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input Row: Attachment + Textarea + Emoji + Voice + Send */}
          <div className="flex items-end gap-2">
            
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => {
                toast.info("Attachment picker: Upload code snippets, assignments or PDF notes.")
              }}
              title="Attach File or Code"
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Paperclip className="size-4" />
            </button>

            {/* Code Snippet Trigger */}
            <button
              type="button"
              onClick={() => {
                setInputText((prev) => prev + "\n```python\n# Write code snippet here\n\n```\n")
                textareaRef.current?.focus()
              }}
              title="Insert Code Snippet"
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Code2 className="size-4" />
            </button>

            {/* Main Message Input Textarea */}
            <div className="flex-1 relative rounded-xl border border-border/80 bg-background/90 px-3 py-2 shadow-inner focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Write a message, ask a doubt, or share code... (Enter to send)"
                className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-32 font-sans"
              />
            </div>

            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() =>
                setShowEmojiPicker((prev) => (prev === "composer" ? null : "composer"))
              }
              title="Insert Emoji"
              className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Smile className="size-4" />
            </button>

            {/* Mic / Voice Note Trigger */}
            <button
              type="button"
              onClick={handleVoiceRecordToggle}
              title={isRecordingVoice ? "Stop & Send Voice Note" : "Hold or Click to Record Voice"}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer shrink-0 shadow-xs",
                isRecordingVoice
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              <Mic className="size-4" />
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              title="Send Message"
              className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send className="size-4" />
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
