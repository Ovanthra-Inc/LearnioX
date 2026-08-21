"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  CommunityChannel,
  CommunityMessage,
  CommunityType,
  INITIAL_CHANNELS,
  SEED_MESSAGES,
  MessageAttachment,
} from "@/types/community"
import { toast } from "sonner"

export function useCommunity(initialChannelId?: string) {
  const [channels, setChannels] = useState<CommunityChannel[]>(INITIAL_CHANNELS)
  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialChannelId || "comm-fullstack"
  )
  const [messages, setMessages] = useState<Record<string, CommunityMessage[]>>(SEED_MESSAGES)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"all" | "courses" | "personal" | "announcements">("all")
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<CommunityType | "ALL">("ALL")
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false)

  // Update active channel if prop changes or URL deep-link
  useEffect(() => {
    if (initialChannelId && channels.some((c) => c.id === initialChannelId)) {
      setActiveChannelId(initialChannelId)
    }
  }, [initialChannelId, channels])

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || channels[0]
  }, [channels, activeChannelId])

  const activeMessages = useMemo(() => {
    return messages[activeChannelId] || []
  }, [messages, activeChannelId])

  // Filter channels based on Search, Tab, and Community Type
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Search matching (title, description, courseTitle, institutionName)
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        q === "" ||
        channel.title.toLowerCase().includes(q) ||
        channel.description.toLowerCase().includes(q) ||
        (channel.courseTitle && channel.courseTitle.toLowerCase().includes(q)) ||
        (channel.institutionName && channel.institutionName.toLowerCase().includes(q))

      if (!matchesSearch) return false

      // Tab filtering
      if (activeTab === "courses") {
        if (channel.type !== "COURSE_CHANNEL" && channel.type !== "DOUBT_SOLVING" && channel.type !== "STUDY_GROUP") {
          return false
        }
      } else if (activeTab === "personal") {
        if (channel.type !== "DIRECT_CHAT") {
          return false
        }
      } else if (activeTab === "announcements") {
        if (channel.type !== "ANNOUNCEMENT_ONLY") {
          return false
        }
      }

      // Community Type filter
      if (selectedTypeFilter !== "ALL" && channel.type !== selectedTypeFilter) {
        return false
      }

      return true
    })
  }, [channels, searchQuery, activeTab, selectedTypeFilter])

  // Send a message inside the active channel
  const sendMessage = useCallback(
    (
      content: string,
      options?: {
        contentType?: "text" | "code" | "file" | "announcement" | "audio"
        language?: string
        attachments?: MessageAttachment[]
        replyTo?: { id: string; senderName: string; content: string }
      }
    ) => {
      if (!content.trim() && (!options?.attachments || options.attachments.length === 0)) return

      const now = new Date()
      const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      const newMessage: CommunityMessage = {
        id: `msg-${Date.now()}`,
        channelId: activeChannelId,
        senderId: "u-current-user",
        senderName: "You (Developer)",
        senderRole: "STUDENT",
        content: content.trim(),
        contentType: options?.contentType || "text",
        language: options?.language,
        attachments: options?.attachments,
        replyTo: options?.replyTo,
        reactions: [],
        createdAt: formattedTime,
        readStatus: "sent",
      }

      setMessages((prev) => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), newMessage],
      }))

      // Update last message in channel card
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === activeChannelId
            ? {
                ...ch,
                lastMessage: {
                  senderName: "You",
                  text: content.trim() || (options?.attachments ? `📎 ${options.attachments[0].title}` : "Sent a message"),
                  timestamp: formattedTime,
                  isUnread: false,
                },
              }
            : ch
        )
      )
    },
    [activeChannelId]
  )

  // Toggle reaction on a message
  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setMessages((prev) => {
        const channelMsgs = prev[activeChannelId] || []
        const updated = channelMsgs.map((msg) => {
          if (msg.id !== messageId) return msg

          const existingReactionIndex = msg.reactions.findIndex((r) => r.emoji === emoji)
          let newReactions = [...msg.reactions]

          if (existingReactionIndex >= 0) {
            const current = newReactions[existingReactionIndex]
            if (current.hasReacted) {
              // Remove user's reaction
              if (current.count <= 1) {
                newReactions.splice(existingReactionIndex, 1)
              } else {
                newReactions[existingReactionIndex] = {
                  ...current,
                  count: current.count - 1,
                  hasReacted: false,
                }
              }
            } else {
              // Add reaction
              newReactions[existingReactionIndex] = {
                ...current,
                count: current.count + 1,
                hasReacted: true,
              }
            }
          } else {
            // New emoji reaction
            newReactions.push({
              emoji,
              count: 1,
              hasReacted: true,
            })
          }

          return { ...msg, reactions: newReactions }
        })

        return { ...prev, [activeChannelId]: updated }
      })
    },
    [activeChannelId]
  )

  // Pin / Unpin message
  const togglePinMessage = useCallback(
    (messageId: string) => {
      setMessages((prev) => {
        const channelMsgs = prev[activeChannelId] || []
        const target = channelMsgs.find((m) => m.id === messageId)
        if (!target) return prev

        const willBePinned = !target.isPinned
        const updated = channelMsgs.map((m) =>
          m.id === messageId ? { ...m, isPinned: willBePinned } : m
        )

        // Update channel's pinned message pointer
        setChannels((cPrev) =>
          cPrev.map((ch) =>
            ch.id === activeChannelId
              ? { ...ch, pinnedMessage: willBePinned ? target : undefined }
              : ch
          )
        )

        toast.success(willBePinned ? "Message pinned to top" : "Message unpinned")
        return { ...prev, [activeChannelId]: updated }
      })
    },
    [activeChannelId]
  )

  // Join a channel (for public/free course channels)
  const joinChannel = useCallback(
    (channelId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? { ...ch, isJoined: true, memberCount: ch.memberCount + 1 }
            : ch
        )
      )
      toast.success("Successfully joined the community channel!")
    },
    []
  )

  // Leave a channel
  const leaveChannel = useCallback(
    (channelId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? { ...ch, isJoined: false, memberCount: Math.max(0, ch.memberCount - 1) }
            : ch
        )
      )
      toast.info("You have left the channel.")
    },
    []
  )

  // Toggle Mute
  const toggleMute = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          const isMuted = !ch.isMuted
          toast.info(isMuted ? "Channel notifications muted" : "Channel notifications unmuted")
          return { ...ch, isMuted }
        }
        return ch
      })
    )
  }, [])

  // Clear history
  const clearHistory = useCallback(
    (channelId: string) => {
      setMessages((prev) => ({
        ...prev,
        [channelId]: [],
      }))
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, lastMessage: undefined, unreadCount: 0 } : ch
        )
      )
      toast.success("Chat history cleared.")
    },
    []
  )

  // Block or Report
  const blockOrReport = useCallback((channelId: string) => {
    toast.error("Channel reported to institution moderators and blocked.")
  }, [])

  // Create a new Course-Specific Community Channel
  const createChannel = useCallback(
    (
      channelData: {
        title: string
        description: string
        type: CommunityType
        courseId?: string
        courseTitle?: string
        isPublic: boolean
        isFreeAccessible: boolean
        rules?: { title: string; description: string }[]
      },
      welcomeMessage?: string
    ) => {
      const newId = `comm-${Date.now()}`
      const newChannel: CommunityChannel = {
        id: newId,
        title: channelData.title,
        slug: channelData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: channelData.description,
        type: channelData.type,
        category: (channelData as any).category || (channelData.type === "ANNOUNCEMENT_ONLY" ? "ANNOUNCEMENTS" : channelData.type === "DOUBT_SOLVING" ? "DOUBT_DESKS" : "COURSE_CHANNELS"),
        accessLevel: channelData.isPublic
          ? "PUBLIC_FREE"
          : channelData.courseId
          ? "ENROLLED_ONLY"
          : "INSTITUTION_ONLY",
        isPublic: channelData.isPublic,
        isFreeAccessible: channelData.isFreeAccessible,
        courseId: channelData.courseId,
        courseTitle: channelData.courseTitle,
        institutionId: "inst-1",
        institutionName: "Ovanthra Institute of Technology",
        verified: true,
        channelLead: (channelData as any).channelLead || {
          id: "u-owner",
          name: "Dr. Sarah Chen",
          email: "sarah.chen@ovanthra.edu",
          role: "OWNER",
        },
        assignedFaculty: (channelData as any).assignedFaculty || [],
        memberCount: 1,
        onlineCount: 1,
        unreadCount: 0,
        isJoined: true,
        isPinned: false,
        bannerColor: "from-blue-600 to-cyan-700",
        rules: channelData.rules?.map((r, i) => ({ id: `r-${i}`, ...r })) || [
          {
            id: "r1",
            title: "Professional Standards",
            description: "Maintain collaborative learning tone and respect all members.",
          },
        ],
        createdAt: new Date().toISOString(),
        lastMessage: welcomeMessage
          ? {
              senderName: "You (Admin)",
              text: welcomeMessage,
              timestamp: "Just now",
              isUnread: false,
            }
          : undefined,
      }

      setChannels((prev) => [newChannel, ...prev])

      if (welcomeMessage) {
        setMessages((prev) => ({
          ...prev,
          [newId]: [
            {
              id: `msg-welcome-${Date.now()}`,
              channelId: newId,
              senderId: "u-current-user",
              senderName: "You (Administrator)",
              senderRole: "INSTITUTION_ADMIN",
              content: welcomeMessage,
              contentType: "announcement",
              reactions: [{ emoji: "🎉", count: 1, hasReacted: true }],
              createdAt: "Just now",
              readStatus: "read",
            },
          ],
        }))
      }

      setActiveChannelId(newId)
      toast.success(`Community channel "# ${channelData.title}" created successfully!`)
      return newId
    },
    []
  )

  // Assign a teacher/TA to a specific channel
  const assignTeacherToChannel = useCallback(
    (
      channelId: string,
      teacher: {
        id: string
        name: string
        email: string
        role: "OWNER" | "ADMIN" | "INSTRUCTOR" | "TA"
        avatar?: string
      }
    ) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch
          const existing = ch.assignedFaculty || []
          if (existing.some((f) => f.id === teacher.id)) {
            toast.info(`${teacher.name} is already assigned to this channel.`)
            return ch
          }
          const updated = [...existing, { ...teacher, assignedAt: "Just now" }]
          toast.success(`Assigned ${teacher.name} (${teacher.role}) to #${ch.title}`)
          return { ...ch, assignedFaculty: updated }
        })
      )
    },
    []
  )

  // Remove a teacher/TA from a channel
  const removeTeacherFromChannel = useCallback((channelId: string, teacherId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch
        const updated = (ch.assignedFaculty || []).filter((f) => f.id !== teacherId)
        toast.info("Teacher access removed from this channel.")
        return { ...ch, assignedFaculty: updated }
      })
    )
  }, [])

  return {
    channels: filteredChannels,
    allChannels: channels,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    activeMessages,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedTypeFilter,
    setSelectedTypeFilter,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    sendMessage,
    toggleReaction,
    togglePinMessage,
    joinChannel,
    leaveChannel,
    toggleMute,
    clearHistory,
    blockOrReport,
    createChannel,
    assignTeacherToChannel,
    removeTeacherFromChannel,
  }
}
