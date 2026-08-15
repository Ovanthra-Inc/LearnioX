"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavLink } from "@/components/ui/nav-link"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function NavSecondary({
  items,
  className,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    onClick?: () => void
    isDestructive?: boolean
  }[]
  className?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { logout } = useAuth()

  const handleAction = (item: (typeof items)[0], e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault()
      item.onClick()
    } else if (item.title.toLowerCase() === "logout") {
      e.preventDefault()
      logout()
      toast.info("Signed out successfully")
    }
  }

  return (
    <SidebarGroup className={cn("px-2 py-2 border-t border-sidebar-border/60 w-full", className)} {...props}>
      <SidebarGroupContent className="w-full">
        <SidebarMenu className="gap-1 w-full">
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className="w-full">
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  "w-full h-9 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-150 ease-in-out cursor-pointer text-sidebar-foreground hover:bg-white hover:text-black group",
                  item.isDestructive
                    ? "hover:bg-white hover:text-black"
                    : "data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:font-semibold"
                )}
              >
                <NavLink
                  href={item.url}
                  onClick={(e) => handleAction(item, e)}
                  className="flex items-center gap-2.5 w-full"
                >
                  <item.icon className="size-4 text-muted-foreground group-hover:text-black group-data-[active=true]:text-black transition-colors shrink-0" />
                  <span className="truncate group-hover:text-black group-data-[active=true]:text-black">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
