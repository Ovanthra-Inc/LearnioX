"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  BookOpen,
  Users,
  Settings,
  MessagesSquare,
  Globe,
  ArrowLeft,
  Headphones,
  Sparkles,
  ExternalLink,
  Shield,
  PanelLeft,
} from "lucide-react"
import { InstitutionSwitcher } from "@/components/institution/institution-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InstitutionSidebarProps extends React.ComponentProps<typeof Sidebar> {
  institution: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    role?: string
  }
  activeTab: "overview" | "members" | "courses" | "community" | "settings"
  onTabChange: (tab: "overview" | "members" | "courses" | "community" | "settings") => void
}

export function InstitutionSidebar({
  institution,
  activeTab,
  onTabChange,
  ...props
}: InstitutionSidebarProps) {
  const { state, toggleSidebar } = useSidebar()

  const STUDIO_ITEMS = [
    {
      id: "overview" as const,
      title: "Overview & Analytics",
      icon: BarChart3,
    },
    {
      id: "courses" as const,
      title: "Course Studio",
      icon: BookOpen,
    },
    {
      id: "members" as const,
      title: "Team & Members",
      icon: Users,
    },
    {
      id: "community" as const,
      title: "Community Channels",
      icon: MessagesSquare,
    },
    {
      id: "settings" as const,
      title: "Settings & Branding",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* 1. Header with Organization Switcher & Collapse Toggle */}
      <SidebarHeader className="border-b border-sidebar-border/50 p-2 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <InstitutionSwitcher currentInstitution={institution} />
          </div>
        </div>
      </SidebarHeader>

      {/* 2. Content Navigation */}
      <SidebarContent className="p-2 space-y-4">
        
        {/* Workspace Management Group */}
        <SidebarGroup className="px-1 py-1 w-full">
          <SidebarGroupLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-sans">
            Institution Studio
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 w-full">
            {STUDIO_ITEMS.map((item) => {
              const isActive = activeTab === item.id
              return (
                <SidebarMenuItem key={item.id} className="w-full">
                  <SidebarMenuButton
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "w-full h-9 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm text-sidebar-foreground transition-all duration-150 cursor-pointer flex items-center gap-2.5",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs border border-primary/20"
                        : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive ? "text-primary font-bold" : "text-sidebar-foreground/70"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary External & Portal Shortcuts */}
        <SidebarGroup className="px-1 py-1 mt-auto w-full">
          <SidebarGroupLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-sans">
            Portals & Shortcuts
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 w-full">
            
            {/* Public Student View Portal */}
            <SidebarMenuItem className="w-full">
              <SidebarMenuButton
                asChild
                tooltip="Public Student View"
                className="w-full h-9 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <Link
                  href={`/institution/slug/${institution.slug || institution.id}`}
                  target="_blank"
                  className="flex items-center gap-2.5 w-full"
                >
                  <Globe className="size-4 text-emerald-500 shrink-0" />
                  <span className="truncate">Public Student Portal</span>
                  <ExternalLink className="size-3 text-muted-foreground ml-auto opacity-70" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Exit to Learner Dashboard */}
            <SidebarMenuItem className="w-full">
              <SidebarMenuButton
                asChild
                tooltip="Learner Dashboard"
                className="w-full h-9 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                  <ArrowLeft className="size-4 text-primary shrink-0" />
                  <span className="truncate">Learner Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Support */}
            <SidebarMenuItem className="w-full">
              <SidebarMenuButton
                asChild
                tooltip="Support & Docs"
                className="w-full h-9 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <Link href="/dashboard/support" className="flex items-center gap-2.5 w-full">
                  <Headphones className="size-4 shrink-0" />
                  <span className="truncate">Support & Docs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
