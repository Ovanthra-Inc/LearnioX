"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu className="w-full">
      <SidebarMenuItem className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="w-full">
            <SidebarMenuButton
              size="lg"
              className="w-full h-11 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group"
            >
              <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs transition-colors">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-1 min-w-0">
                <span className="truncate font-semibold text-xs tracking-tight text-sidebar-foreground group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground transition-colors">
                  {activeTeam.name}
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground/80 group-data-[state=open]:text-sidebar-accent-foreground/80 font-normal transition-colors">
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground transition-colors shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-popover-foreground z-50"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              Organizations
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors group/item"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-border bg-secondary group-hover/item:border-primary/50 transition-colors">
                  <team.logo className="size-3.5 shrink-0 text-foreground" />
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="font-medium text-foreground">{team.name}</span>
                  <span className="text-[10px] text-muted-foreground">{team.plan}</span>
                </div>
                <DropdownMenuShortcut className="text-[10px] text-muted-foreground">
                  ⌘{index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1 bg-border" />
            <DropdownMenuItem className="gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors group/add">
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-border bg-transparent group-hover/add:border-foreground">
                <Plus className="size-3.5 text-muted-foreground group-hover/add:text-foreground" />
              </div>
              <span className="font-medium text-muted-foreground group-hover/add:text-foreground">Add organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
