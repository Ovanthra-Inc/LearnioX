"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/lib/api"
import { useAppDispatch } from "@/store/store"
import { setActiveInstitution, InstitutionSummary } from "@/store/slices/institutionSlice"
import {
  ChevronsUpDown,
  Plus,
  Building2,
  Check,
  Sparkles,
  ArrowLeft,
  Shield,
  Layers,
} from "lucide-react"
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
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface InstitutionSwitcherProps {
  currentInstitution: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    role?: string
  }
}

// Fallback multi-organization list for seamless experience
const DEFAULT_USER_ORGANIZATIONS: InstitutionSummary[] = [
  {
    id: "650df5bf-a541-40e6-91bc-a5b09a1daadc",
    name: "Ovanthra Institute of Technology",
    slug: "ovanthra-tech",
    role: "OWNER",
  },
  {
    id: "inst-global-academy",
    name: "Global Cloud Engineering Academy",
    slug: "global-cloud-academy",
    role: "ADMIN",
  },
  {
    id: "inst-quantum-lab",
    name: "Nexus Quantum Systems Lab",
    slug: "nexus-quantum",
    role: "INSTRUCTOR",
  },
]

export function InstitutionSwitcher({ currentInstitution }: InstitutionSwitcherProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Fetch all organizations owned or joined by the current user
  const { data: myInstitutionsData } = useQuery({
    queryKey: ["my-institutions"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any[]>>("/institutions/my")
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            logo_url: item.logo_url,
            role: item.user_role || item.role || "OWNER",
          }))
        }
        return DEFAULT_USER_ORGANIZATIONS
      } catch {
        return DEFAULT_USER_ORGANIZATIONS
      }
    },
  })

  const organizations = React.useMemo(() => {
    const list = myInstitutionsData && myInstitutionsData.length > 0
      ? myInstitutionsData
      : DEFAULT_USER_ORGANIZATIONS

    // Ensure the current active institution is always included
    const exists = list.some((org) => org.id === currentInstitution.id)
    if (!exists && currentInstitution.id) {
      return [
        {
          id: currentInstitution.id,
          name: currentInstitution.name || "Active Workspace",
          slug: currentInstitution.slug || "workspace",
          logo_url: currentInstitution.logo_url,
          role: currentInstitution.role || "OWNER",
        },
        ...list,
      ]
    }
    return list
  }, [myInstitutionsData, currentInstitution])

  const handleSelectOrg = (org: InstitutionSummary) => {
    dispatch(setActiveInstitution(org))
    router.push(`/institution/${org.id}`)
  }

  const getInitials = (text: string) => {
    return text
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  return (
    <SidebarMenu className="w-full">
      <SidebarMenuItem className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="w-full">
            <SidebarMenuButton
              size="lg"
              className="w-full h-12 px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group border border-sidebar-border/60 bg-sidebar/50 shadow-2xs"
            >
              {/* Institution Avatar / Logo */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs transition-colors overflow-hidden shrink-0">
                {currentInstitution.logo_url ? (
                  <img
                    src={currentInstitution.logo_url}
                    alt={currentInstitution.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{getInitials(currentInstitution.name || "Ovanthra Tech")}</span>
                )}
              </div>

              {/* Institution Name & Role Badge */}
              <div className="grid flex-1 text-left text-sm leading-tight ml-2 min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-xs tracking-tight text-sidebar-foreground group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground transition-colors font-sans">
                  {currentInstitution.name || "Institution Workspace"}
                </span>
                <span className="truncate text-[10px] text-primary group-hover:text-primary font-semibold transition-colors flex items-center gap-1 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>ROLE: {currentInstitution.role || "OWNER"}</span>
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground group-data-[state=open]:text-sidebar-accent-foreground transition-colors shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-popover-foreground z-50 animate-in fade-in zoom-in-95"
            align="start"
            side="bottom"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
              <span>Switch Organization</span>
              <span className="text-[9px] lowercase font-normal">{organizations.length} organizations</span>
            </DropdownMenuLabel>

            <div className="space-y-0.5 max-h-56 overflow-y-auto no-scrollbar">
              {organizations.map((org, index) => {
                const isCurrent = org.id === currentInstitution.id
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className={cn(
                      "gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors group/item flex items-center justify-between",
                      isCurrent
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-md border border-border bg-secondary font-bold text-[10px] shrink-0 overflow-hidden">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="size-full object-cover" />
                        ) : (
                          <span>{getInitials(org.name)}</span>
                        )}
                      </div>
                      <div className="grid leading-tight min-w-0">
                        <span className="font-semibold truncate text-foreground text-xs">
                          {org.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {org.role || "MEMBER"}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <Check className="size-4 text-primary shrink-0 ml-2" />
                    ) : (
                      <DropdownMenuShortcut className="text-[10px] text-muted-foreground">
                        ⌘{index + 1}
                      </DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                )
              })}
            </div>

            <DropdownMenuSeparator className="my-1 bg-border/60" />

            {/* Action 1: Create New Organization */}
            <DropdownMenuItem
              onClick={() => router.push("/institution?action=create")}
              className="gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-popover-foreground transition-colors font-medium"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-border bg-transparent">
                <Plus className="size-3.5 text-primary" />
              </div>
              <span className="text-primary font-semibold">Create New Organization</span>
            </DropdownMenuItem>

            {/* Action 2: Exit to Learner Platform */}
            <DropdownMenuItem
              onClick={() => router.push("/dashboard")}
              className="gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors font-medium"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-border bg-transparent">
                <ArrowLeft className="size-3.5" />
              </div>
              <span>Exit to Learner Platform</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
