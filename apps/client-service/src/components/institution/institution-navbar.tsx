"use client"

import React from "react"
import Link from "next/link"
import { NavUser } from "@/components/nav-user"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Globe,
  ExternalLink,
  UserPlus,
  Building2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

interface InstitutionNavbarProps {
  institution: {
    id: string
    name: string
    slug: string
    role?: string
  }
  activeTabTitle: string
  isAdminOrOwner: boolean
  onInviteClick: () => void
}

export function InstitutionNavbar({
  institution,
  activeTabTitle,
  isAdminOrOwner,
  onInviteClick,
}: InstitutionNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-card/60 px-4 sm:px-6 backdrop-blur-md">
      
      {/* Left: Sidebar Toggle + Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <SidebarTrigger className="-ml-1 mr-1 size-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer" />
        <div className="h-4 w-px bg-border/80 mr-1 hidden sm:block" />
        
        <Link
          href="/institution"
          className="text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer flex items-center gap-1"
        >
          <Building2 className="size-3.5" />
          <span>Institutions</span>
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="font-bold text-foreground font-sans truncate max-w-[150px] sm:max-w-[220px]">
          {institution.name}
        </span>
        <ChevronRight className="size-3 text-muted-foreground/60 hidden sm:inline" />
        <span className="text-primary font-bold hidden sm:inline">
          {activeTabTitle}
        </span>
      </div>

      {/* Right: Actions + NavUser Avatar */}
      <div className="flex items-center gap-3">
        
        {/* Public View Shortcut */}
        <Link
          href={`/institution/slug/${institution.slug || institution.id}`}
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-2xs"
        >
          <Globe className="size-3.5 text-emerald-500" />
          <span>Public Portal</span>
          <ExternalLink className="size-3 text-muted-foreground opacity-70" />
        </Link>

        {/* Invite Member CTA (Admin/Owner) */}
        {isAdminOrOwner && (
          <button
            type="button"
            onClick={onInviteClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span className="hidden sm:inline">Invite Member</span>
          </button>
        )}

        <div className="h-4 w-px bg-border/60" />

        {/* Top-Right Permanent User Profile */}
        <NavUser />
      </div>

    </header>
  )
}
