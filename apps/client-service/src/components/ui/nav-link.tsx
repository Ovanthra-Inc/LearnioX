"use client"

import * as React from "react"
import Link, { LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface NavLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  activeClassName?: string
  exact?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, children, className, activeClassName = "bg-sidebar-accent text-sidebar-accent-foreground font-semibold", exact = false, onClick, ...props }, ref) => {
    const pathname = usePathname()
    const hrefString = typeof href === "string" ? href : href.pathname || ""

    const isActive = exact
      ? pathname === hrefString
      : pathname === hrefString || (hrefString !== "/" && hrefString !== "#" && pathname.startsWith(hrefString))

    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        data-active={isActive}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

NavLink.displayName = "NavLink"
