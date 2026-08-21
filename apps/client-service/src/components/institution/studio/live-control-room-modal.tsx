"use client"

import React, { useState } from "react"
import {
  Radio,
  Video,
  Copy,
  Check,
  Eye,
  EyeOff,
  Activity,
  Users,
  MessageSquare,
  Sparkles,
  Settings,
  X,
  Play,
  Square,
  Share2,
  Shield,
  Send,
  Pin,
  Flame,
  Globe,
  Lock,
} from "lucide-react"
import { StudioLiveStream } from "@/types/studio"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface LiveControlRoomModalProps {
  isOpen: boolean
  onClose: () => void
  stream?: StudioLiveStream
}

export function LiveControlRoomModal({
  isOpen,
  onClose,
  stream = {
    id: "live-active",
    title: "Live TA Office Hours: Debugging Asyncpg Deadlocks & Docker Networking",
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
}: LiveControlRoomModalProps) {
  const [isLive, setIsLive] = useState<boolean>(true)
  const [showStreamKey, setShowStreamKey] = useState<boolean>(false)
  const [copiedKey, setCopiedKey] = useState<boolean>(false)
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"stream-settings" | "stream-health" | "analytics">("stream-settings")

  // Live Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: "1", user: "Devon Vance", role: "STUDENT", text: "Can you review why connection pool timeout happens when max_overflow is exceeded?", time: "10:32 AM" },
    { id: "2", user: "Maya Ray", role: "STUDENT", text: "Is pool_recycle=1800 recommended for AWS Aurora Postgres?", time: "10:34 AM" },
    { id: "3", user: "Kavya Patel (Lead TA)", role: "INSTRUCTOR", text: "Yes Maya! Setting pool_recycle below the server idle timeout prevents broken connection drops.", time: "10:35 AM" },
  ])
  const [chatInput, setChatInput] = useState("")

  if (!isOpen) return null

  const handleCopy = (text: string, type: "key" | "url") => {
    navigator.clipboard.writeText(text)
    if (type === "key") {
      setCopiedKey(true)
      toast.success("Stream key copied to clipboard!")
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedUrl(true)
      toast.success("Stream URL copied to clipboard!")
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        user: "Dr. Sarah Chen (Owner)",
        role: "OWNER",
        text: chatInput.trim(),
        time: "Just now",
      },
    ])
    setChatInput("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Live Control Room Window (YouTube Studio Style) */}
      <div className="relative z-50 w-full max-w-6xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Top Control Room Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-sidebar shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-600/20 text-rose-500 font-black">
              <Radio className="size-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-foreground font-sans truncate max-w-xl">
                  {stream.title}
                </h3>
                {isLive ? (
                  <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.2 text-[10px] font-bold text-white uppercase">
                    <span className="size-1.5 rounded-full bg-white animate-ping" />
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-bold text-muted-foreground uppercase">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{stream.courseTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsLive(!isLive)
                toast.success(isLive ? "Live stream ended." : "Broadcast is now LIVE!")
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5",
                isLive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isLive ? (
                <>
                  <Square className="size-3.5 fill-current" />
                  <span>END STREAM</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span>GO LIVE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 min-h-0">
          
          {/* LEFT 2 COLUMNS: Stream Monitor & OBS / RTMP Controls */}
          <div className="lg:col-span-2 flex flex-col min-h-0 border-r border-border overflow-y-auto p-5 space-y-5">
            
            {/* Live Video Monitor Stage */}
            <div className="relative aspect-video rounded-2xl bg-zinc-950 border border-border/80 overflow-hidden shadow-xl flex items-center justify-center group">
              <img
                src={stream.thumbnailUrl}
                alt="Stream Preview"
                className="size-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Status Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-white">
                  <Activity className="size-3.5 text-emerald-400" />
                  <span>{stream.resolution} • {stream.fps} FPS</span>
                </span>
                <span className="bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <span>{stream.currentViewers} watching</span>
                </span>
              </div>

              {/* Center Monitor State */}
              <div className="absolute flex flex-col items-center gap-1 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/30">
                  <Radio className="size-7 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">
                  Live Encoder Connected • OBS / vMix Ready
                </span>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="font-semibold">Bitrate: {stream.bitrateKbps} kbps</span>
                <span className="font-semibold">Audio: 128 kbps AAC</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Excellent Connection</span>
                </span>
              </div>
            </div>

            {/* Stream Settings Tabs */}
            <div className="space-y-3 text-xs">
              <div className="border-b border-border flex gap-4 font-bold">
                {[
                  { id: "stream-settings", label: "Stream Setup (RTMP)" },
                  { id: "stream-health", label: "Stream Health" },
                  { id: "analytics", label: "Live Analytics" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={cn(
                      "pb-2.5 transition-colors cursor-pointer border-b-2",
                      activeTab === t.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: RTMP STREAM KEYS */}
              {activeTab === "stream-settings" && (
                <div className="space-y-4 pt-1">
                  {/* Stream URL */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Stream URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={stream.streamUrl}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(stream.streamUrl, "url")}
                        className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedUrl ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Stream Key */}
                  <div className="space-y-1">
                    <label className="font-bold text-foreground flex items-center justify-between">
                      <span>Stream Key (paste in OBS Studio / Streamlabs)</span>
                      <span className="text-[10px] text-muted-foreground">Keep this key secret</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showStreamKey ? "text" : "password"}
                          readOnly
                          value={stream.streamKey}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStreamKey(!showStreamKey)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showStreamKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(stream.streamKey, "key")}
                        className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        {copiedKey ? <Check className="size-3" /> : <Copy className="size-3" />}
                        <span>Copy Key</span>
                      </button>
                    </div>
                  </div>

                  {/* Stream Latency Setting */}
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-foreground">Stream Latency</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl border border-primary bg-primary/10 text-primary font-bold text-center cursor-pointer">
                        <div className="text-xs">Ultra-Low Latency</div>
                        <div className="text-[10px] text-muted-foreground font-normal">Real-time Q&A (~1.5s)</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-center cursor-pointer">
                        <div className="text-xs font-semibold">Low Latency</div>
                        <div className="text-[10px] text-muted-foreground">Standard live (~4s)</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-center cursor-pointer">
                        <div className="text-xs font-semibold">Normal Latency</div>
                        <div className="text-[10px] text-muted-foreground">Best video quality (~10s)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STREAM HEALTH */}
              {activeTab === "stream-health" && (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Activity className="size-5 text-emerald-500" />
                      <div>
                        <div className="font-bold text-foreground">Encoder Health: Optimal</div>
                        <div className="text-[11px] text-muted-foreground">Stable frame delivery with 0 dropped frames</div>
                      </div>
                    </div>
                    <span className="text-emerald-500 font-bold text-xs">Healthy</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">Video Bitrate</div>
                      <div className="text-sm font-black text-foreground font-sans mt-0.5">4,520 kbps</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">FPS</div>
                      <div className="text-sm font-black text-foreground font-sans mt-0.5">60.0 FPS</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">Resolution</div>
                      <div className="text-sm font-black text-foreground font-sans mt-0.5">1920x1080</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">Dropped Frames</div>
                      <div className="text-sm font-black text-emerald-500 font-sans mt-0.5">0 (0.0%)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Concurrent Viewers</span>
                    <div className="text-2xl font-black text-foreground font-sans">{stream.currentViewers}</div>
                    <p className="text-[10px] text-emerald-500 font-semibold">+18 joining now</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Peak Viewers</span>
                    <div className="text-2xl font-black text-foreground font-sans">{stream.peakViewers}</div>
                    <p className="text-[10px] text-muted-foreground">Recorded at 10:20 AM</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Live Doubts Solved</span>
                    <div className="text-2xl font-black text-foreground font-sans">14</div>
                    <p className="text-[10px] text-primary font-semibold">100% resolution</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Live Student Chat & Moderation Feed */}
          <div className="flex flex-col min-h-0 bg-sidebar/50">
            {/* Chat Top Header */}
            <div className="h-10 px-4 border-b border-border flex items-center justify-between shrink-0 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-primary" />
                <span>Live Student Chat</span>
              </span>
              <span className="text-[10px] text-muted-foreground">{chatMessages.length} messages</span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs no-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-xl bg-card border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{msg.user}</span>
                      {msg.role === "INSTRUCTOR" && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                          TA
                        </span>
                      )}
                      {msg.role === "OWNER" && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold">
                          FACULTY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Bottom Chat Input */}
            <div className="p-3 border-t border-border bg-card/60">
              <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat as Dr. Sarah Chen (Owner)..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-sans"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer shadow-xs"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
