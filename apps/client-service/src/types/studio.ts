export type VideoVisibility = "PUBLIC" | "ENROLLED_ONLY" | "UNLISTED" | "PRIVATE" | "SCHEDULED"

export type ProcessingStatus = "READY" | "PROCESSING" | "TRANSCRIBING" | "DRAFT"

export interface StudioLecture {
  id: string
  title: string
  description: string
  duration: string
  durationSeconds: number
  thumbnailUrl: string
  videoUrl?: string
  courseId: string
  courseTitle: string
  moduleId?: string
  moduleTitle?: string
  visibility: VideoVisibility
  status: ProcessingStatus
  createdAt: string
  viewsCount: number
  doubtsCount: number
  completionRate: number // percentage e.g. 84
  rating: number // e.g. 4.9
  hasSubtitles: boolean
  hasSandbox: boolean
  hasQuiz: boolean
}

export type LiveStreamStatus = "LIVE_NOW" | "UPCOMING" | "ENDED"

export interface StudioLiveStream {
  id: string
  title: string
  description: string
  scheduledStartTime: string
  actualStartTime?: string
  status: LiveStreamStatus
  thumbnailUrl: string
  courseId: string
  courseTitle: string
  streamKey: string
  streamUrl: string
  currentViewers: number
  peakViewers: number
  chatMessageCount: number
  latencyMode: "ULTRA_LOW" | "LOW" | "NORMAL"
  resolution: string
  bitrateKbps: number
  fps: number
  instructorName: string
}

export const SEED_STUDIO_LECTURES: StudioLecture[] = [
  {
    id: "lec-1",
    title: "1.1 Fast-API Async Architecture & Database Connection Pooling",
    description: "Deep dive into SQLAlchemy 2.0 AsyncSession, connection pool recycling with pool_pre_ping, and lifespan contexts.",
    duration: "24:15",
    durationSeconds: 1455,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    moduleId: "m1",
    moduleTitle: "Module 1: High-Performance Backend Architectures",
    visibility: "PUBLIC",
    status: "READY",
    createdAt: "Aug 18, 2026",
    viewsCount: 3842,
    doubtsCount: 24,
    completionRate: 91,
    rating: 4.9,
    hasSubtitles: true,
    hasSandbox: true,
    hasQuiz: true,
  },
  {
    id: "lec-2",
    title: "1.2 Docker Multi-Stage Builds & Nginx Ingress Reverse Proxy",
    description: "Optimizing container sizes from 1.2GB down to 120MB using Alpine Linux and configuring Nginx rate limits.",
    duration: "32:40",
    durationSeconds: 1960,
    thumbnailUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80",
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    moduleId: "m1",
    moduleTitle: "Module 1: High-Performance Backend Architectures",
    visibility: "ENROLLED_ONLY",
    status: "READY",
    createdAt: "Aug 16, 2026",
    viewsCount: 2910,
    doubtsCount: 18,
    completionRate: 88,
    rating: 4.8,
    hasSubtitles: true,
    hasSandbox: true,
    hasQuiz: false,
  },
  {
    id: "lec-3",
    title: "2.1 RAG Embeddings & Vector Search with pgvector",
    description: "Setting up cosine distance indexing with IVFFlat in PostgreSQL 16 and chunking Markdown files.",
    duration: "45:10",
    durationSeconds: 2710,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    courseId: "c2",
    courseTitle: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)",
    moduleId: "m2",
    moduleTitle: "Module 2: Vector Indexing & Hybrid Retrieval",
    visibility: "PUBLIC",
    status: "READY",
    createdAt: "Aug 12, 2026",
    viewsCount: 5120,
    doubtsCount: 42,
    completionRate: 94,
    rating: 5.0,
    hasSubtitles: true,
    hasSandbox: true,
    hasQuiz: true,
  },
  {
    id: "lec-4",
    title: "2.2 LangChain Agent Tool Calling & Autonomous Subagents",
    description: "Implementing ReAct reasoning loops with JSON function calling and sandbox runtime execution.",
    duration: "38:25",
    durationSeconds: 2305,
    thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
    courseId: "c2",
    courseTitle: "Applied AI, LLMs & Retrieval Augmented Generation (RAG)",
    moduleId: "m2",
    moduleTitle: "Module 2: Vector Indexing & Hybrid Retrieval",
    visibility: "ENROLLED_ONLY",
    status: "PROCESSING",
    createdAt: "Today at 02:30 PM",
    viewsCount: 140,
    doubtsCount: 3,
    completionRate: 72,
    rating: 4.9,
    hasSubtitles: true,
    hasSandbox: true,
    hasQuiz: false,
  },
  {
    id: "lec-5",
    title: "3.1 Kubernetes Helm Charts & Automated Ingress SSL Rotation",
    description: "Configuring Cert-Manager with Let's Encrypt ACME challenges and deploying microservice pods.",
    duration: "52:18",
    durationSeconds: 3138,
    thumbnailUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&auto=format&fit=crop&q=80",
    courseId: "c3",
    courseTitle: "Distributed Systems & Cloud DevOps Engineering",
    moduleId: "m3",
    moduleTitle: "Module 3: Cloud Infrastructure & Observability",
    visibility: "SCHEDULED",
    status: "READY",
    createdAt: "Scheduled for Aug 25",
    viewsCount: 0,
    doubtsCount: 0,
    completionRate: 0,
    rating: 5.0,
    hasSubtitles: true,
    hasSandbox: true,
    hasQuiz: true,
  },
]

export const SEED_STUDIO_LIVE_STREAMS: StudioLiveStream[] = [
  {
    id: "live-1",
    title: "🔴 Live TA Office Hours: Debugging Asyncpg Deadlocks & Docker Networking",
    description: "Bring your broken docker-compose configurations and database connection timeout logs for live 1-on-1 resolution.",
    scheduledStartTime: "Live Now",
    actualStartTime: "Started 35 mins ago",
    status: "LIVE_NOW",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    streamKey: "live_lnx_9482938a9d82138e",
    streamUrl: "rtmp://live.learniox.com/app",
    currentViewers: 142,
    peakViewers: 218,
    chatMessageCount: 384,
    latencyMode: "ULTRA_LOW",
    resolution: "1080p60",
    bitrateKbps: 4500,
    fps: 60,
    instructorName: "Kavya Patel (Lead TA)",
  },
  {
    id: "live-2",
    title: "Upcoming Cohort Workshop: Building Real-Time Chat with WebSockets & Redis Pub/Sub",
    description: "Architecting multi-server message brokers with Redis cluster and broadcasting message events to Next.js clients.",
    scheduledStartTime: "Tomorrow at 5:00 PM UTC",
    status: "UPCOMING",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    courseId: "c1",
    courseTitle: "Full-Stack Web Development & Microservices Mastery",
    streamKey: "live_lnx_8841029481a0b39c",
    streamUrl: "rtmp://live.learniox.com/app",
    currentViewers: 0,
    peakViewers: 0,
    chatMessageCount: 18,
    latencyMode: "LOW",
    resolution: "1080p60",
    bitrateKbps: 4500,
    fps: 60,
    instructorName: "Dr. Sarah Chen",
  },
]
