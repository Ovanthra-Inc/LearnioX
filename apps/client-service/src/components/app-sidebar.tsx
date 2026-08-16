"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Building2,
  Headphones,
  Home,
  LogOut,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { SearchModal } from "@/components/search-modal"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const sidebarData = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Courses & Curriculum",
      url: "/courses",
      icon: BookOpen,
    },
    {
      title: "Institutions",
      url: "/institution",
      icon: Building2,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/dashboard/support",
      icon: Headphones,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Logout",
      url: "#",
      icon: LogOut,
      isDestructive: true,
    },
  ],
}

function AppSidebarHeader() {
  const { state, toggleSidebar } = useSidebar()
  const [searchOpen, setSearchOpen] = React.useState(false)

  return (
    <>
      <div className="flex h-11 items-center justify-between px-2 w-full group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        {/* Brand / Logo - hidden when collapsed */}
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-1 py-1 rounded-md text-sidebar-foreground hover:opacity-90 transition-opacity"
          >
            <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shadow-xs">
              <Sparkles className="size-3.5" />
            </div>
            <span className="truncate font-bold font-sans text-base tracking-tight text-sidebar-foreground">
              Learnio<span className="text-primary font-bold">X</span>
            </span>
          </Link>
        </div>

        {/* Action icons: Search + Collapse trigger */}
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
          {/* Search Button (hidden when collapsed) */}
          <div className="group-data-[collapsible=icon]:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                  title="Search (⌘K)"
                >
                  <Search className="size-4" />
                  <span className="sr-only">Search</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Search (⌘K)
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Sidebar Collapse/Expand Trigger (Always visible!) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebar}
                data-sidebar="trigger"
                className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                title={state === "collapsed" ? "Open sidebar" : "Close sidebar"}
              >
                <PanelLeft className="size-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side={state === "collapsed" ? "right" : "bottom"}
              align="center"
            >
              {state === "collapsed" ? "Open sidebar" : "Close sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/40 pb-2">
        <AppSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
