export type CommunityType =
  | "COURSE_CHANNEL"      // Course-specific discussion & announcements
  | "ANNOUNCEMENT_ONLY"   // Broadcast-only channel by instructors/institution
  | "STUDY_GROUP"         // Collaborative study & project group
  | "DOUBT_SOLVING"       // Q&A / Office hours with TAs & Mentors
  | "GENERAL_LOUNGE"      // Open campus / institution social lounge
  | "DIRECT_CHAT"         // 1-on-1 personal or mentor chat

export type AccessLevel =
  | "PUBLIC_FREE"         // Open to everyone including external free students
  | "ENROLLED_ONLY"       // Restricted to students enrolled in the specific course
  | "INSTITUTION_ONLY"    // Restricted to verified members of the institution
  | "INVITE_ONLY"         // Private invite link only

export type MemberRole = "INSTITUTION_ADMIN" | "INSTRUCTOR" | "TA" | "STUDENT" | "GUEST"

export interface CommunityMember {
  id: string
  name: string
  avatar?: string
  role: MemberRole
  isOnline: boolean
  lastSeen?: string
  title?: string
}

export interface CommunityReaction {
  emoji: string
  count: number
  hasReacted?: boolean
  users?: string[]
}

export interface MessageAttachment {
  id: string
  type: "file" | "image" | "code" | "link" | "audio"
  title: string
  url: string
  size?: string
  extension?: string
}

export interface CommunityMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole: MemberRole
  content: string
  contentType: "text" | "code" | "file" | "announcement" | "audio"
  language?: string // For code snippets e.g. "typescript", "python"
  attachments?: MessageAttachment[]
  replyTo?: {
    id: string
    senderName: string
    content: string
  }
  reactions: CommunityReaction[]
  createdAt: string
  isPinned?: boolean
  isEdited?: boolean
  readStatus?: "sent" | "delivered" | "read"
}

export interface CommunityRule {
  id: string
  title: string
  description: string
}

export type DiscordCategory =
  | "ANNOUNCEMENTS"
  | "COURSE_CHANNELS"
  | "DOUBT_DESKS"
  | "FACULTY_ONLY"
  | "VOICE_ROOMS"

export interface FacultyAssignee {
  id: string
  name: string
  email: string
  role: "OWNER" | "ADMIN" | "INSTRUCTOR" | "TA"
  avatar?: string
  assignedAt?: string
}

export interface CommunityChannel {
  id: string
  title: string
  slug: string
  description: string
  type: CommunityType
  accessLevel: AccessLevel
  category: DiscordCategory
  isPublic: boolean
  isFreeAccessible: boolean
  isVoice?: boolean
  
  // Associated Course / Institution
  courseId?: string
  courseTitle?: string
  courseSlug?: string
  courseLevel?: string
  institutionId?: string
  institutionName?: string

  avatar?: string
  bannerColor?: string
  verified?: boolean

  channelLead?: FacultyAssignee
  assignedFaculty?: FacultyAssignee[]

  memberCount: number
  onlineCount: number
  unreadCount: number
  
  lastMessage?: {
    senderName: string
    text: string
    timestamp: string
    isUnread?: boolean
  }

  pinnedMessage?: CommunityMessage
  rules?: CommunityRule[]
  
  isPinned?: boolean
  isJoined?: boolean
  isMuted?: boolean
  createdAt: string
}

export const COMMUNITY_TYPE_CONFIG: Record<
  CommunityType,
  { label: string; badgeColor: string; iconBg: string; description: string }
> = {
  COURSE_CHANNEL: {
    label: "Course Channel",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconBg: "from-blue-600/20 to-indigo-600/20",
    description: "Official course discussion and class group",
  },
  ANNOUNCEMENT_ONLY: {
    label: "Broadcast Only",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconBg: "from-amber-600/20 to-orange-600/20",
    description: "Important institution & instructor broadcasts",
  },
  STUDY_GROUP: {
    label: "Study Group",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    iconBg: "from-emerald-600/20 to-teal-600/20",
    description: "Collaborative peer learning and project cohorts",
  },
  DOUBT_SOLVING: {
    label: "Doubt Solving",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconBg: "from-purple-600/20 to-fuchsia-600/20",
    description: "Dedicated TA help, debugging & Q&A desk",
  },
  GENERAL_LOUNGE: {
    label: "Campus Lounge",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    iconBg: "from-cyan-600/20 to-blue-600/20",
    description: "Open community social lounge and networking",
  },
  DIRECT_CHAT: {
    label: "Direct Message",
    badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    iconBg: "from-zinc-600/20 to-neutral-600/20",
    description: "1-on-1 direct mentor or peer conversation",
  },
}

// Initial Seed Data for Instant Realistic Discord/Telegram Experience
export const INITIAL_CHANNELS: CommunityChannel[] = [
  {
    id: "comm-announcements",
    title: "global-announcements",
    slug: "global-announcements",
    description:
      "Verified institution updates, platform feature drops, hackathons, and global certification announcements.",
    type: "ANNOUNCEMENT_ONLY",
    category: "ANNOUNCEMENTS",
    accessLevel: "PUBLIC_FREE",
    isPublic: true,
    isFreeAccessible: true,
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-owner",
      name: "Dr. Sarah Chen",
      email: "sarah.chen@ovanthra.edu",
      role: "OWNER",
    },
    memberCount: 14200,
    onlineCount: 1940,
    unreadCount: 0,
    isJoined: true,
    isPinned: true,
    bannerColor: "from-indigo-600 to-violet-800",
    lastMessage: {
      senderName: "Dean of Academic Systems",
      text: "📢 Registration for Spring 2026 Developer Hackathon is officially open!",
      timestamp: "Aug 15",
      isUnread: false,
    },
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "comm-fullstack",
    title: "fullstack-mastery",
    slug: "full-stack-microservices-hub",
    description:
      "Official community channel for Full-Stack Web Development with Next.js 14, Python FastAPI, PostgreSQL 16, and Docker multi-tenant architectures.",
    type: "COURSE_CHANNEL",
    category: "COURSE_CHANNELS",
    accessLevel: "PUBLIC_FREE",
    isPublic: true,
    isFreeAccessible: true,
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    courseSlug: "full-stack-microservices",
    courseLevel: "INTERMEDIATE",
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-instructor-1",
      name: "Dr. Sarah Chen",
      email: "sarah.chen@ovanthra.edu",
      role: "OWNER",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    assignedFaculty: [
      {
        id: "u-ta-1",
        name: "Kavya Patel",
        email: "kavya.patel@ovanthra.edu",
        role: "TA",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
        assignedAt: "Jan 12, 2026",
      },
      {
        id: "u-instructor-2",
        name: "Alex Rivera",
        email: "alex.rivera@ovanthra.edu",
        role: "INSTRUCTOR",
        assignedAt: "Jan 15, 2026",
      },
    ],
    memberCount: 3842,
    onlineCount: 429,
    unreadCount: 3,
    isJoined: true,
    isPinned: true,
    bannerColor: "from-blue-600 to-indigo-700",
    lastMessage: {
      senderName: "Dr. Sarah Chen",
      text: "🚀 Assignment 2 solution & Docker Compose templates are now live in Module 4!",
      timestamp: "10:42 AM",
      isUnread: true,
    },
    rules: [
      {
        id: "r1",
        title: "Respectful & Professional Communication",
        description: "Treat all fellow developers, TAs, and instructors with courtesy and respect.",
      },
      {
        id: "r2",
        title: "Code Formatting",
        description: "Always format code snippets using markdown code fences or GitHub gist links.",
      },
    ],
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "comm-ai-rag",
    title: "ai-llm-rag-hub",
    slug: "applied-ai-llm-rag-hub",
    description:
      "Dive deep into LLM fine-tuning, embeddings, vector indexing with pgvector, LangChain pipelines, and agentic workflows.",
    type: "COURSE_CHANNEL",
    category: "COURSE_CHANNELS",
    accessLevel: "PUBLIC_FREE",
    isPublic: true,
    isFreeAccessible: true,
    courseId: "c2",
    courseTitle: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)",
    courseSlug: "applied-ai-llm-rag",
    courseLevel: "ADVANCED",
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-instructor-2",
      name: "Alex Rivera",
      email: "alex.rivera@ovanthra.edu",
      role: "INSTRUCTOR",
    },
    assignedFaculty: [
      {
        id: "u-instructor-1",
        name: "Dr. Sarah Chen",
        email: "sarah.chen@ovanthra.edu",
        role: "OWNER",
      },
    ],
    memberCount: 5120,
    onlineCount: 812,
    unreadCount: 0,
    isJoined: true,
    isPinned: true,
    bannerColor: "from-purple-600 to-pink-700",
    lastMessage: {
      senderName: "Alex Rivera",
      text: "What chunking strategy gives the highest precision for technical documentation?",
      timestamp: "Yesterday",
      isUnread: false,
    },
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "comm-doubt-desk",
    title: "fastapi-nextjs-doubts",
    slug: "fastapi-nextjs-doubt-desk",
    description:
      "Get rapid answers from verified TAs, instructors, and senior alumni for frontend/backend blockers.",
    type: "DOUBT_SOLVING",
    category: "DOUBT_DESKS",
    accessLevel: "PUBLIC_FREE",
    isPublic: true,
    isFreeAccessible: true,
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-ta-1",
      name: "Kavya Patel",
      email: "kavya.patel@ovanthra.edu",
      role: "TA",
    },
    memberCount: 2740,
    onlineCount: 380,
    unreadCount: 0,
    isJoined: true,
    isPinned: false,
    bannerColor: "from-amber-600 to-orange-700",
    lastMessage: {
      senderName: "Kavya Patel (TA)",
      text: "Check if your CORS middleware allows origins with explicit credentials set to true.",
      timestamp: "Aug 18",
      isUnread: false,
    },
    createdAt: "2026-02-05T12:00:00Z",
  },
  {
    id: "comm-faculty-lounge",
    title: "faculty-staff-lounge",
    slug: "faculty-staff-lounge",
    description: "Private academic discussion, curriculum synchronization, and grading rubrics for verified educators.",
    type: "GENERAL_LOUNGE",
    category: "FACULTY_ONLY",
    accessLevel: "INSTITUTION_ONLY",
    isPublic: false,
    isFreeAccessible: false,
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-owner",
      name: "Dr. Sarah Chen",
      email: "sarah.chen@ovanthra.edu",
      role: "OWNER",
    },
    assignedFaculty: [
      { id: "u-instructor-2", name: "Alex Rivera", email: "alex.rivera@ovanthra.edu", role: "INSTRUCTOR" },
      { id: "u-ta-1", name: "Kavya Patel", email: "kavya.patel@ovanthra.edu", role: "TA" },
      { id: "u-admin-1", name: "Marcus Aurelius", email: "marcus@ovanthra.edu", role: "ADMIN" },
    ],
    memberCount: 14,
    onlineCount: 6,
    unreadCount: 2,
    isJoined: true,
    isPinned: false,
    bannerColor: "from-red-600 to-rose-800",
    lastMessage: {
      senderName: "Marcus Aurelius (Admin)",
      text: "Final exam questions for Module 8 are drafted and pending peer review.",
      timestamp: "08:30 AM",
      isUnread: true,
    },
    createdAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "comm-voice-office-hours",
    title: "Live TA Office Hours & Sandbox",
    slug: "live-ta-office-hours",
    description: "Live voice channel & screen sharing desk for real-time debugging and 1-on-1 student assistance.",
    type: "GENERAL_LOUNGE",
    category: "VOICE_ROOMS",
    accessLevel: "PUBLIC_FREE",
    isPublic: true,
    isFreeAccessible: true,
    isVoice: true,
    institutionId: "inst-1",
    institutionName: "Ovanthra Institute of Technology",
    verified: true,
    channelLead: {
      id: "u-ta-1",
      name: "Kavya Patel",
      email: "kavya.patel@ovanthra.edu",
      role: "TA",
    },
    memberCount: 42,
    onlineCount: 8,
    unreadCount: 0,
    isJoined: true,
    isPinned: false,
    bannerColor: "from-emerald-600 to-teal-800",
    lastMessage: {
      senderName: "System",
      text: "🎙️ Voice channel active with 3 participants.",
      timestamp: "Live",
      isUnread: false,
    },
    createdAt: "2026-01-08T00:00:00Z",
  },
]

// Seeded Sample Messages for Full-Stack Channel
export const SEED_MESSAGES: Record<string, CommunityMessage[]> = {
  "comm-fullstack": [
    {
      id: "msg-1",
      channelId: "comm-fullstack",
      senderId: "u-instructor-1",
      senderName: "Dr. Sarah Chen",
      senderRole: "INSTRUCTOR",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      content:
        "👋 Welcome everyone to the **Full-Stack Web Development & Microservices Mastery** community channel!\n\nThis channel is synchronized with your course modules. Feel free to ask questions, share project screenshots, debug queries, and collaborate on microservice architectures.",
      contentType: "announcement",
      isPinned: true,
      reactions: [
        { emoji: "🚀", count: 48, hasReacted: true },
        { emoji: "🔥", count: 32, hasReacted: false },
        { emoji: "❤️", count: 24, hasReacted: false },
        { emoji: "👏", count: 19, hasReacted: true },
      ],
      createdAt: "Yesterday at 09:15 AM",
      readStatus: "read",
    },
    {
      id: "msg-2",
      channelId: "comm-fullstack",
      senderId: "u-student-1",
      senderName: "Devon Vance",
      senderRole: "STUDENT",
      content:
        "Quick question regarding Module 3: When configuring the SQLAlchemy 2.0 async engine in Python FastAPI, should we enable `pool_pre_ping=True` in production with PostgreSQL 16?",
      contentType: "text",
      reactions: [
        { emoji: "👍", count: 6, hasReacted: false },
        { emoji: "💡", count: 4, hasReacted: false },
      ],
      createdAt: "Yesterday at 10:30 AM",
      readStatus: "read",
    },
    {
      id: "msg-3",
      channelId: "comm-fullstack",
      senderId: "u-ta-1",
      senderName: "Kavya Patel",
      senderRole: "TA",
      senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      content:
        "Yes, Devon! `pool_pre_ping=True` is strongly recommended. It ensures that stale/disconnected connections in the connection pool are tested and recycled before passing them to an active request handler.",
      contentType: "code",
      language: "python",
      replyTo: {
        id: "msg-2",
        senderName: "Devon Vance",
        content: "When configuring the SQLAlchemy 2.0 async engine in Python FastAPI, should we enable pool_pre_ping=True?",
      },
      attachments: [
        {
          id: "att-1",
          type: "code",
          title: "database_session.py",
          url: "#",
          size: "1.4 KB",
          extension: "py",
        },
      ],
      reactions: [
        { emoji: "🔥", count: 14, hasReacted: true },
        { emoji: "🎯", count: 9, hasReacted: false },
        { emoji: "🙏", count: 11, hasReacted: false },
      ],
      createdAt: "Yesterday at 10:45 AM",
      readStatus: "read",
    },
    {
      id: "msg-4",
      channelId: "comm-fullstack",
      senderId: "u-instructor-1",
      senderName: "Dr. Sarah Chen",
      senderRole: "INSTRUCTOR",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      content:
        "🚀 Assignment 2 solution & Docker Compose templates are now live in Module 4! Check out the attached PDF guide and let us know if you run into port binding conflicts.",
      contentType: "file",
      attachments: [
        {
          id: "att-2",
          type: "file",
          title: "LearnioX_Microservices_Architecture_Specs_v2.pdf",
          url: "#",
          size: "4.8 MB",
          extension: "pdf",
        },
      ],
      reactions: [
        { emoji: "🚀", count: 27, hasReacted: true },
        { emoji: "🎉", count: 18, hasReacted: false },
        { emoji: "❤️", count: 15, hasReacted: false },
      ],
      createdAt: "10:42 AM",
      readStatus: "read",
    },
  ],
  "comm-ai-rag": [
    {
      id: "ai-1",
      channelId: "comm-ai-rag",
      senderId: "u-instructor-2",
      senderName: "Alex Rivera",
      senderRole: "INSTRUCTOR",
      content: "Welcome to the Applied AI & RAG Hub! What chunking strategy gives the highest precision for technical documentation in your experiments?",
      contentType: "text",
      reactions: [{ emoji: "🤖", count: 18, hasReacted: true }],
      createdAt: "Yesterday",
      readStatus: "read",
    },
  ],
}
