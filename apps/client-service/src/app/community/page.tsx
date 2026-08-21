"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useCommunity } from "@/hooks/useCommunity"
import { CommunitySidebarList } from "@/components/community/community-sidebar-list"
import { TelegramChatArea } from "@/components/community/telegram-chat-area"
import { ChannelProfileDrawer } from "@/components/community/channel-profile-drawer"
import { CreateChannelModal } from "@/components/community/create-channel-modal"
import { ChevronLeft, Loader2 } from "lucide-react"

function CommunityContent() {
  const searchParams = useSearchParams()
  const initialChannelParam = searchParams.get("channel") || undefined

  const {
    channels,
    allChannels,
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
  } = useCommunity(initialChannelParam)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const handleSelectChannel = (id: string) => {
    setActiveChannelId(id)
    setMobileShowChat(true)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex h-svh flex-col overflow-hidden bg-background text-foreground">
        
        {/* Floating Top Right User Avatar (Clean, no global topbar) */}
        <div className="hidden lg:flex absolute top-2.5 right-4 z-30 items-center gap-2">
          <NavUser />
        </div>

        {/* 3-Column Layout: (App Sidebar -> Channels List -> Telegram Chat Area) */}
        <div className="flex flex-1 h-full overflow-hidden">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: Channels List (Middle column in desktop, full screen in mobile) */}
          {/* ========================================================================= */}
          <aside
            className={`w-full lg:w-80 xl:w-96 shrink-0 h-full flex flex-col border-r border-border/60 ${
              mobileShowChat ? "hidden lg:flex" : "flex"
            }`}
          >
            <CommunitySidebarList
              channels={channels}
              allChannelsCount={allChannels.length}
              activeChannelId={activeChannelId}
              onSelectChannel={handleSelectChannel}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedTypeFilter={selectedTypeFilter}
              onTypeFilterChange={setSelectedTypeFilter}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          </aside>

          {/* ========================================================================= */}
          {/* COLUMN 2: Telegram-Style Channel Chat Area & Right Canvas                 */}
          {/* ========================================================================= */}
          <main
            className={`flex-1 h-full flex flex-col min-w-0 bg-background ${
              !mobileShowChat ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Mobile Back to Channels bar */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-secondary/40 text-xs">
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="flex items-center gap-1 font-semibold text-primary cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>All Channels</span>
              </button>
            </div>

            {activeChannel ? (
              <TelegramChatArea
                channel={activeChannel}
                messages={activeMessages}
                onSendMessage={sendMessage}
                onToggleReaction={toggleReaction}
                onTogglePinMessage={togglePinMessage}
                onJoinChannel={joinChannel}
                onLeaveChannel={leaveChannel}
                onToggleMute={toggleMute}
                onClearHistory={clearHistory}
                onBlockOrReport={blockOrReport}
                onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a community channel to start chatting
              </div>
            )}
          </main>

        </div>

        {/* ========================================================================= */}
        {/* TELEGRAM CHANNEL PROFILE & RULES DRAWER                                   */}
        {/* ========================================================================= */}
        {activeChannel && (
          <ChannelProfileDrawer
            channel={activeChannel}
            isOpen={isProfileDrawerOpen}
            onClose={() => setIsProfileDrawerOpen(false)}
            onToggleMute={() => toggleMute(activeChannel.id)}
            onLeaveChannel={() => {
              leaveChannel(activeChannel.id)
              setIsProfileDrawerOpen(false)
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* CREATE COMMUNITY CHANNEL MODAL                                            */}
        {/* ========================================================================= */}
        <CreateChannelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={createChannel}
        />

      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <CommunityContent />
    </Suspense>
  )
}
