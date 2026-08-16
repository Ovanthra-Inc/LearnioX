"use client"

import { type LucideIcon } from "lucide-react"
import { NavLink } from "@/components/ui/nav-link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup className="px-2 py-2 w-full">
      <SidebarGroupLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1 w-full">
        {items.map((item) => (
          <SidebarMenuItem key={item.title} className="w-full">
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={item.isActive}
              className="w-full h-9 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm text-sidebar-foreground transition-all duration-150 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold cursor-pointer group"
            >
              <NavLink href={item.url} className="flex items-center gap-2.5 w-full">
                {item.icon && (
                  <item.icon className="size-4 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground transition-colors shrink-0" />
                )}
                <span className="truncate group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground">{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
