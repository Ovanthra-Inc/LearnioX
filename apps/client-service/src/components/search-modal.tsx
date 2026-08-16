"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  BookOpen,
  Building2,
  Settings,
  Headphones,
  Home,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  Command,
  X,
  Code,
  Shield,
  Layers,
  GraduationCap,
  Sliders,
} from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  category: "Navigation" | "Courses & Catalog" | "Settings" | "Actions"
  icon: React.ElementType
  url?: string
  action?: () => void
  keywords?: string[]
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const [query, setQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isDebouncing, setIsDebouncing] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Debounce logic (180ms)
  React.useEffect(() => {
    setIsDebouncing(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsDebouncing(false)
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setDebouncedQuery("")
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Search items database
  const searchItems: SearchItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-home",
        title: "Home",
        subtitle: "Platform dashboard, workspace & activity",
        category: "Navigation",
        icon: Home,
        url: "/dashboard",
        keywords: ["dashboard", "home", "main", "playground", "workspace"],
      },
      {
        id: "nav-courses",
        title: "Courses & Curriculum",
        subtitle: "Explore verified tracks, certifications & authoring",
        category: "Navigation",
        icon: BookOpen,
        url: "/courses",
        keywords: ["courses", "curriculum", "modules", "classes", "learning"],
      },
      {
        id: "nav-institutions",
        title: "Institutions & Teams",
        subtitle: "Multi-tenant organizations, roles & tenant workspaces",
        category: "Navigation",
        icon: Building2,
        url: "/institution",
        keywords: ["institutions", "teams", "organizations", "enterprise", "tenants"],
      },
      {
        id: "nav-settings",
        title: "Settings",
        subtitle: "Preferences, appearance, AI models & security",
        category: "Navigation",
        icon: Settings,
        url: "/dashboard/settings",
        keywords: ["settings", "preferences", "config", "editor", "theme"],
      },
      {
        id: "nav-support",
        title: "Support & Docs",
        subtitle: "Platform documentation, helpdesk & tickets",
        category: "Navigation",
        icon: Headphones,
        url: "/dashboard/support",
        keywords: ["support", "help", "docs", "tickets", "contact"],
      },

      // Courses & Catalog
      {
        id: "course-fullstack",
        title: "Full-Stack Web Development Mastery",
        subtitle: "Next.js 14, FastAPI, PostgreSQL & Docker microservices",
        category: "Courses & Catalog",
        icon: Code,
        url: "/courses",
        keywords: ["nextjs", "react", "fastapi", "python", "fullstack", "docker"],
      },
      {
        id: "course-ai",
        title: "Applied AI & LLM Systems Engineering",
        subtitle: "RAG architectures, LangChain, embeddings & fine-tuning",
        category: "Courses & Catalog",
        icon: Sparkles,
        url: "/courses",
        keywords: ["ai", "machine learning", "rag", "llm", "langchain", "embeddings"],
      },
      {
        id: "course-systems",
        title: "Distributed Systems & Cloud Architecture",
        subtitle: "Kubernetes, Kafka event streaming & high availability",
        category: "Courses & Catalog",
        icon: Layers,
        url: "/courses",
        keywords: ["distributed", "kubernetes", "kafka", "cloud", "scalability"],
      },
      {
        id: "course-cert",
        title: "Enterprise Architecture Certification",
        subtitle: "Accredited institutional engineering diploma track",
        category: "Courses & Catalog",
        icon: GraduationCap,
        url: "/courses",
        keywords: ["certificate", "diploma", "enterprise", "accredited"],
      },

      // Settings
      {
        id: "setting-theme-toggle",
        title: "Toggle Visual Color Theme",
        subtitle: `Currently using ${theme === "dark" ? "Dark Modern" : "Light Modern"} theme`,
        category: "Settings",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          setTheme(theme === "dark" ? "light" : "dark")
          onOpenChange(false)
        },
        keywords: ["theme", "dark", "light", "mode", "color"],
      },
      {
        id: "setting-ai-provider",
        title: "Configure AI Model Provider",
        subtitle: "Switch between Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro",
        category: "Settings",
        icon: Sliders,
        url: "/dashboard/settings",
        keywords: ["model", "claude", "gpt", "gemini", "ai", "provider"],
      },
      {
        id: "setting-security",
        title: "Dual-Cookie Session & Security",
        subtitle: "HttpOnly cookie rotation and token lifetime settings",
        category: "Settings",
        icon: Shield,
        url: "/dashboard/settings",
        keywords: ["security", "cookies", "auth", "tokens", "session"],
      },
    ],
    [theme, setTheme, onOpenChange]
  )

  // Filter items by query
  const filteredItems = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) {
      return searchItems.slice(0, 7)
    }

    return searchItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q)
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q))
      const matchCategory = item.category.toLowerCase().includes(q)
      return matchTitle || matchSubtitle || matchKeywords || matchCategory
    })
  }, [debouncedQuery, searchItems])

  // Reset selected index when filtered list changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length])

  // Handle item selection
  const handleSelect = (item: SearchItem) => {
    onOpenChange(false)
    if (item.action) {
      item.action()
    } else if (item.url) {
      router.push(item.url)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex])
      }
    }
  }

  // Group items by category
  const categories = React.useMemo(() => {
    const map = new Map<string, SearchItem[]>()
    filteredItems.forEach((item) => {
      const cat = item.category
      if (!map.has(cat)) {
        map.set(cat, [])
      }
      map.get(cat)!.push(item)
    })
    return Array.from(map.entries())
  }, [filteredItems])

  if (!open) return null

  let runningIndex = 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Card - Increased padding & width */}
      <div
        onKeyDown={handleKeyDown}
        className="relative z-50 w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
      >
        {/* Search Header Input with larger padding */}
        <div className="flex items-center border-b border-border/60 px-5 py-4 gap-3.5">
          <Search className={cn("size-4.5 shrink-0 transition-colors", isDebouncing ? "text-primary animate-pulse" : "text-muted-foreground")} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, pages, settings, actions..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-none font-sans"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results / Suggestions with No Scrollbar thumb and generous padding */}
        <div className="max-h-[400px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-3 sm:p-4 space-y-4 transition-all duration-200">
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center text-xs text-muted-foreground space-y-1.5">
              <Search className="mx-auto size-7 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No suggestions found</p>
              <p className="text-xs">Try searching for "Courses", "Home", or "Settings"</p>
            </div>
          ) : (
            categories.map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-muted-foreground/90 uppercase font-sans">
                  {category}
                </div>
                {items.map((item) => {
                  const currentIndex = runningIndex++
                  const isSelected = currentIndex === selectedIndex
                  const Icon = item.icon

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-xs transition-all duration-150 cursor-pointer group",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs font-medium translate-x-0.5"
                          : "text-foreground hover:bg-secondary/80 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            isSelected
                              ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground"
                              : "border-border bg-secondary/60 text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="grid leading-tight truncate">
                          <span className="truncate font-semibold text-xs sm:text-sm font-sans">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={cn(
                                "truncate text-[11px] sm:text-xs font-normal transition-colors mt-0.5",
                                isSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight
                        className={cn(
                          "size-4 shrink-0 transition-transform ml-2 opacity-0 group-hover:opacity-100",
                          isSelected && "opacity-100 text-primary-foreground translate-x-0.5"
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Shortcuts with generous padding */}
        <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-5 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5 ml-2">
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px]">↵</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Command className="size-3.5" />
            <span className="font-medium">LearnioX Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}
