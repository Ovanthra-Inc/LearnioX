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
              className="w-full h-11 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-sidebar-foreground hover:bg-white hover:text-black data-[state=open]:bg-white data-[state=open]:text-black group"
            >
              <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs group-hover:bg-black group-hover:text-white transition-colors">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-1 min-w-0">
                <span className="truncate font-semibold text-xs tracking-tight text-sidebar-foreground group-hover:text-black group-data-[state=open]:text-black transition-colors">
                  {activeTeam.name}
                </span>
                <span className="truncate text-[11px] text-muted-foreground group-hover:text-black/70 group-data-[state=open]:text-black/70 font-normal transition-colors">
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground group-hover:text-black group-data-[state=open]:text-black transition-colors shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-xl border border-[#333333] bg-[#1e1e1e] p-1.5 shadow-2xl opacity-100 text-white z-50"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold text-[#888888] tracking-wider uppercase">
              Organizations
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white hover:text-black text-white transition-colors group/item"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-[#3c3c3c] bg-[#252526] group-hover/item:border-black group-hover/item:bg-black group-hover/item:text-white transition-colors">
                  <team.logo className="size-3.5 shrink-0 text-[#cccccc] group-hover/item:text-white" />
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="font-medium text-white group-hover/item:text-black">{team.name}</span>
                  <span className="text-[10px] text-[#888888] group-hover/item:text-black/70">{team.plan}</span>
                </div>
                <DropdownMenuShortcut className="text-[10px] text-[#888888] group-hover/item:text-black/70">
                  ⌘{index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1 bg-[#333333]" />
            <DropdownMenuItem className="gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white hover:text-black text-white transition-colors group/add">
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-[#555555] bg-transparent group-hover/add:border-black">
                <Plus className="size-3.5 text-[#888888] group-hover/add:text-black" />
              </div>
              <span className="font-medium text-[#aaaaaa] group-hover/add:text-black">Add organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
