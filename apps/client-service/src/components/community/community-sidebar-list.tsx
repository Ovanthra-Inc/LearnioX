"use client"

import React from "react"
import { Search, X, Layers, Filter, Sparkles, BookOpen, MessageCircle, Megaphone, Users, HelpCircle } from "lucide-react"
import { CommunityChannel, CommunityType, COMMUNITY_TYPE_CONFIG } from "@/types/community"
import { CommunityHeader } from "@/components/community/community-header"
import { CommunityCard } from "@/components/community/community-card"
import { cn } from "@/lib/utils"

interface CommunitySidebarListProps {
  channels: CommunityChannel[]
  allChannelsCount: number
  activeChannelId: string
  onSelectChannel: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  activeTab: "all" | "courses" | "personal" | "announcements"
  onTabChange: (tab: "all" | "courses" | "personal" | "announcements") => void
  selectedTypeFilter: CommunityType | "ALL"
  onTypeFilterChange: (type: CommunityType | "ALL") => void
  onCreateClick: () => void
}

export function CommunitySidebarList({
  channels,
  allChannelsCount,
  activeChannelId,
  onSelectChannel,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedTypeFilter,
  onTypeFilterChange,
  onCreateClick,
}: CommunitySidebarListProps) {
  const totalUnread = channels.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  const TABS: {
    id: "all" | "courses" | "personal" | "announcements"
    label: string
    icon: React.ElementType
    count?: number
  }[] = [
    { id: "all", label: "All", icon: Layers, count: allChannelsCount },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "personal", label: "Personal", icon: MessageCircle },
    { id: "announcements", label: "Broadcasts", icon: Megaphone },
  ]

  const TYPE_FILTERS: { id: CommunityType | "ALL"; label: string }[] = [
    { id: "ALL", label: "All Types" },
    { id: "COURSE_CHANNEL", label: "Courses" },
    { id: "STUDY_GROUP", label: "Study Groups" },
    { id: "DOUBT_SOLVING", label: "Doubt Desks" },
    { id: "ANNOUNCEMENT_ONLY", label: "Broadcasts" },
    { id: "GENERAL_LOUNGE", label: "Lounges" },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-card/25 border-r border-border/60 overflow-hidden">
      {/* 1. Header with Create Channel action */}
      <CommunityHeader unreadTotal={totalUnread} onCreateClick={onCreateClick} />

      {/* 2. Search Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 shadow-inner transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="size-3.5 text-muted-foreground shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search channels, courses, TAs..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Navigation Tabs (All, Courses, Personal, Broadcasts) matching wireframe */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border/50">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-background text-foreground shadow-xs scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                {tab.icon && <tab.icon className="size-3" />}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Sub-Filter Pills (Community Types) */}
      <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-border/40">
        {TYPE_FILTERS.map((tf) => {
          const isSelected = selectedTypeFilter === tf.id
          return (
            <button
              key={tf.id}
              type="button"
              onClick={() => onTypeFilterChange(tf.id)}
              className={cn(
                "whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-secondary hover:text-foreground"
              )}
            >
              {tf.label}
            </button>
          )
        })}
      </div>

      {/* 5. Scrollable Channel Cards Feed */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {channels.length === 0 ? (
          <div className="p-6 text-center space-y-2 text-muted-foreground">
            <Layers className="mx-auto size-7 opacity-40" />
            <p className="text-xs font-medium">No community channels found</p>
            <p className="text-[11px] text-muted-foreground/70">
              Try adjusting your search or tab filter
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("")
                  onTabChange("all")
                  onTypeFilterChange("ALL")
                }}
                className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          channels.map((channel) => (
            <CommunityCard
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
