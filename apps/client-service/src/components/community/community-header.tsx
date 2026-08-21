"use client"

import React from "react"
import { Plus, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CommunityHeaderProps {
  unreadTotal: number
  onCreateClick?: () => void
  showCreate?: boolean
}

export function CommunityHeader({ unreadTotal, onCreateClick, showCreate = false }: CommunityHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3 border-b border-border/60 bg-card/40 backdrop-blur-xs">
      {/* Title & Badge */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <MessagesSquare className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground font-sans flex items-center gap-1.5">
            <span>Community</span>
            {unreadTotal > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[9px]">
                {unreadTotal}
              </span>
            )}
          </h2>
          <p className="text-[10px] text-muted-foreground">Course channels & student hubs</p>
        </div>
      </div>

      {/* Action Button / Verified Indicator */}
      {showCreate && onCreateClick ? (
        <button
          type="button"
          onClick={onCreateClick}
          title="Create new course community channel"
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-2.5 py-1 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Channel</span>
        </button>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
          <ShieldCheck className="size-3" />
          <span>Verified Network</span>
        </div>
      )}
    </div>
  )
}
