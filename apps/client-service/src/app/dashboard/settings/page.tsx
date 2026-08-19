"use client"

import * as React from "react"
import Link from "next/link"
import {
  SlidersHorizontal,
  Palette,
  Code2,
  Sparkles,
  Target,
  ShieldCheck,
  Boxes,
  Bell,
  Search,
  Check,
  RotateCcw,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Laptop,
  User,
  Shield,
  X,
  Flame,
  KeyRound,
  FileCode,
  TerminalSquare,
  Cpu,
  RefreshCw,
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type SettingScope = "user" | "workspace" | "platform"

export interface SettingOption {
  label: string
  value: string
  description?: string
}

export interface SettingItem {
  id: string
  category: string
  scope: SettingScope
  title: string
  subtitle?: string
  description: string
  linkText?: string
  linkUrl?: string
  type: "select" | "text" | "number" | "switch" | "theme-picker"
  options?: SettingOption[]
  unit?: string
  min?: number
  max?: number
  step?: number
  defaultValue: string | number | boolean
}

interface CategoryMeta {
  id: string
  name: string
  icon: React.ElementType
  description: string
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "commonly-used",
    name: "Commonly Used",
    icon: SlidersHorizontal,
    description: "Quick access to the most frequently adjusted preferences across LearnioX.",
  },
  {
    id: "appearance",
    name: "Appearance & Themes",
    icon: Palette,
    description: "Customize the interface style, colors, fonts, and visual density.",
  },
  {
    id: "editor",
    name: "Code Editor & Sandboxes",
    icon: Code2,
    description: "Configure code formatting, indentation, tab sizing, and interactive terminals.",
  },
  {
    id: "ai-tutor",
    name: "AI & Smart Tutor",
    icon: Sparkles,
    description: "Tailor AI models, auto-completions, automated quizzes, and explanation styles.",
  },
  {
    id: "learning",
    name: "Learning & Streaks",
    icon: Target,
    description: "Set daily study targets, streaks reminders, and curriculum progression goals.",
  },
  {
    id: "security",
    name: "Security & Sessions",
    icon: ShieldCheck,
    description: "Manage dual-cookie authentication, token timeouts, and access governance.",
  },
  {
    id: "workspace",
    name: "Workspace & Containers",
    icon: Boxes,
    description: "Set default cloud sandbox allocations, memory limits, and auto-save behaviors.",
  },
  {
    id: "notifications",
    name: "Notifications & Alerts",
    icon: Bell,
    description: "Manage digest emails, course update notifications, and webhook triggers.",
  },
]

const ALL_SETTINGS: SettingItem[] = [
  // 1. COMMONLY USED
  {
    id: "workbench.colorTheme",
    category: "commonly-used",
    scope: "user",
    title: "Interface Theme",
    subtitle: "Specifies the visual theme used across the entire LearnioX platform.",
    description: "Choose between modern dark, midnight navy, light mode, or cyber contrast.",
    type: "theme-picker",
    defaultValue: "dark-modern",
  },
  {
    id: "files.autoSave",
    category: "commonly-used",
    scope: "user",
    title: "Files: Auto Save",
    subtitle: "Controls auto save of workspace files and interactive editor tabs.",
    description: "Automatically persists unsaved code modifications after a configurable delay.",
    type: "select",
    options: [
      { label: "Off", value: "off", description: "Save manually using Ctrl+S" },
      { label: "After Delay (1000ms)", value: "afterDelay", description: "Save automatically 1s after last stroke" },
      { label: "On Focus Change", value: "onFocusChange", description: "Save whenever editor loses focus" },
      { label: "On Window Change", value: "onWindowChange", description: "Save when switching browser tabs" },
    ],
    defaultValue: "afterDelay",
  },
  {
    id: "editor.fontSize",
    category: "commonly-used",
    scope: "user",
    title: "Editor Font Size",
    subtitle: "Controls font size in pixels for all code editors, diff viewers, and terminals.",
    description: "Adjust readable text sizing in the learning sandboxes and problem panels.",
    type: "number",
    unit: "px",
    min: 10,
    max: 32,
    step: 1,
    defaultValue: 14,
  },
  {
    id: "ai.modelProvider",
    category: "commonly-used",
    scope: "platform",
    title: "AI Model Provider",
    subtitle: "Primary foundation model powering intelligent tutors and smart hints.",
    description: "Select the LLM engine for interactive tutor feedback, error explanations, and quizzes.",
    type: "select",
    options: [
      { label: "Claude 3.5 Sonnet (Recommended)", value: "claude-3-5-sonnet", description: "Fastest code generation and deep reasoning" },
      { label: "GPT-4o Omni", value: "gpt-4o", description: "High precision multilingual coding" },
      { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro", description: "Ultra-long context window for whole repositories" },
      { label: "DeepSeek R1", value: "deepseek-r1", description: "Specialized algorithmic verification and math" },
    ],
    defaultValue: "claude-3-5-sonnet",
  },
  {
    id: "learning.dailyGoalMinutes",
    category: "commonly-used",
    scope: "user",
    title: "Daily Learning Target",
    subtitle: "Target daily learning goal in minutes to build consistent streaks.",
    description: "Active time spent solving challenges, watching lectures, or reviewing flashcards.",
    type: "number",
    unit: "mins/day",
    min: 5,
    max: 240,
    step: 5,
    defaultValue: 30,
  },

  // 2. APPEARANCE & THEMES
  {
    id: "appearance.uiDensity",
    category: "appearance",
    scope: "user",
    title: "Layout Density",
    subtitle: "Compact or comfortable interface spacing across feeds and sandboxes.",
    description: "Controls the padding and item spacing in table views, sidebars, and course cards.",
    type: "select",
    options: [
      { label: "Comfortable (Default)", value: "comfortable" },
      { label: "Compact", value: "compact" },
      { label: "Spacious", value: "spacious" },
    ],
    defaultValue: "comfortable",
  },
  {
    id: "appearance.sidebarPosition",
    category: "appearance",
    scope: "workspace",
    title: "Sidebar Dock Position",
    subtitle: "Controls whether the primary navigation rail is pinned to the left or right.",
    description: "Customizes navigation layout for ultra-wide displays or RTL workflows.",
    type: "select",
    options: [
      { label: "Left Dock (Standard)", value: "left" },
      { label: "Right Dock", value: "right" },
    ],
    defaultValue: "left",
  },
  {
    id: "appearance.animations",
    category: "appearance",
    scope: "user",
    title: "Smooth Micro-Animations & Glow Effects",
    subtitle: "Subtle card hover glows, pulse indicators, and transition animations.",
    description: "Disable this if you prefer reduced motion or wish to conserve GPU battery life.",
    type: "switch",
    defaultValue: true,
  },

  // 3. CODE EDITOR & SANDBOXES
  {
    id: "editor.fontFamily",
    category: "editor",
    scope: "user",
    title: "Editor Font Family",
    subtitle: "Font family for code snippets, markdown blocks, and terminal outputs.",
    description: "Monospace font stack with automatic ligatures support.",
    type: "text",
    defaultValue: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  {
    id: "editor.tabSize",
    category: "editor",
    scope: "user",
    title: "Tab Indentation Size",
    subtitle: "The number of spaces a tab key stroke is equal to.",
    description: "Standard indentation for code formatting and auto-indent engine.",
    type: "number",
    unit: "spaces",
    min: 2,
    max: 8,
    step: 2,
    defaultValue: 2,
  },
  {
    id: "editor.lineNumbers",
    category: "editor",
    scope: "user",
    title: "Line Numbers Display",
    subtitle: "Controls the visibility of line numbers in the editor margin.",
    description: "Choose between standard absolute line numbers, relative numbering, or clean hidden margins.",
    type: "select",
    options: [
      { label: "On (Absolute)", value: "on" },
      { label: "Relative", value: "relative" },
      { label: "Off", value: "off" },
    ],
    defaultValue: "on",
  },
  {
    id: "editor.wordWrap",
    category: "editor",
    scope: "user",
    title: "Editor Word Wrapping",
    subtitle: "Controls how long lines wrap in interactive sandbox buffers.",
    description: "Wraps text at the viewport edge to avoid horizontal scrolling.",
    type: "select",
    options: [
      { label: "On (Wrap at viewport)", value: "on" },
      { label: "Off (Horizontal scroll)", value: "off" },
      { label: "Word Wrap Column (80 chars)", value: "wordWrapColumn" },
    ],
    defaultValue: "on",
  },
  {
    id: "editor.formatOnSave",
    category: "editor",
    scope: "user",
    title: "Format On Save (Prettier / Ruff)",
    subtitle: "Automatically format file buffer syntax whenever saving.",
    description: "Enforces standard language formatting (Prettier, Black, Rustfmt, GoFmt).",
    type: "switch",
    defaultValue: true,
  },

  // 4. AI & SMART TUTOR
  {
    id: "ai.inlineSuggestions",
    category: "ai-tutor",
    scope: "user",
    title: "Inline AI Code Completions",
    subtitle: "Ghost text autocomplete suggestions as you write code in sandboxes.",
    description: "Context-aware autocompletions based on current lesson curriculum.",
    type: "switch",
    defaultValue: true,
  },
  {
    id: "ai.explanationTone",
    category: "ai-tutor",
    scope: "user",
    title: "Tutor Explanation Depth",
    subtitle: "Level of detail provided when asking for lesson or bug breakdowns.",
    description: "Calibrate between concise step-by-step hints or deep foundational explanations.",
    type: "select",
    options: [
      { label: "Socratic & Guiding (Hints first)", value: "socratic" },
      { label: "Comprehensive & Detailed", value: "detailed" },
      { label: "Concise & Code-Centric", value: "concise" },
    ],
    defaultValue: "socratic",
  },
  {
    id: "ai.autoQuizGeneration",
    category: "ai-tutor",
    scope: "user",
    title: "Adaptive Knowledge Quizzes",
    subtitle: "Generate dynamic micro-quizzes based on recently completed lessons.",
    description: "Reinforces retention with spaced repetition checks at the end of each module.",
    type: "switch",
    defaultValue: true,
  },

  // 5. LEARNING & STREAKS
  {
    id: "learning.streakFreezeProtection",
    category: "learning",
    scope: "user",
    title: "Automatic Streak Freeze Protection",
    subtitle: "Protects your active study streak during unforeseen offline days.",
    description: "Maintains your consecutive day counter with up to 2 monthly streak freezes.",
    type: "switch",
    defaultValue: true,
  },
  {
    id: "learning.autoShareCertificates",
    category: "learning",
    scope: "user",
    title: "Auto-Generate Verified Badges",
    subtitle: "Generate tamper-proof cryptographic badges upon track completion.",
    description: "Enables public verifiable URLs for LinkedIn and resume showcasing.",
    type: "switch",
    defaultValue: true,
  },
  {
    id: "learning.weekendGoals",
    category: "learning",
    scope: "user",
    title: "Include Weekends in Streak Calculations",
    subtitle: "Count Saturday and Sunday towards continuous streak maintenance.",
    description: "Toggle off if you prefer a strict 5-day Monday-Friday study schedule.",
    type: "switch",
    defaultValue: true,
  },

  // 6. SECURITY & SESSIONS
  {
    id: "security.cookieManagement",
    category: "security",
    scope: "platform",
    title: "Dual-Cookie Session Security",
    subtitle: "Strict HttpOnly dual-cookie token storage with silent refresh rotation.",
    description: "Enforces HttpOnly SameSite=Lax credentials and encrypted refresh tokens.",
    type: "select",
    options: [
      { label: "Strict HttpOnly Dual-Cookie (Enforced)", value: "strict" },
      { label: "Dual Bearer Fallback", value: "dual" },
    ],
    defaultValue: "strict",
  },
  {
    id: "security.sessionTimeoutDays",
    category: "security",
    scope: "platform",
    title: "Refresh Session Lifetime",
    subtitle: "Maximum days before user session expires and requires re-authentication.",
    description: "Configures active refresh token expiration interval for multi-tenant users.",
    type: "number",
    unit: "days",
    min: 1,
    max: 30,
    step: 1,
    defaultValue: 7,
  },
  {
    id: "security.twoFactorAuth",
    category: "security",
    scope: "user",
    title: "Two-Factor Authentication (2FA / TOTP)",
    subtitle: "Require authenticator app verification code on untrusted device logins.",
    description: "Adds an additional defense layer for institutional and admin workspaces.",
    type: "switch",
    defaultValue: false,
  },

  // 7. WORKSPACE & CONTAINERS
  {
    id: "workspace.ramLimit",
    category: "workspace",
    scope: "workspace",
    title: "Cloud Sandbox RAM Allocation",
    subtitle: "Memory quota dedicated per isolated sandbox Docker container.",
    description: "Higher quotas allow running heavier ML models, database replicas, and build tools.",
    type: "select",
    options: [
      { label: "2 GB RAM (Standard Tier)", value: "2gb" },
      { label: "4 GB RAM (Pro Accelerated)", value: "4gb" },
      { label: "8 GB RAM (Enterprise Dedicated)", value: "8gb" },
    ],
    defaultValue: "4gb",
  },
  {
    id: "workspace.terminalShell",
    category: "workspace",
    scope: "workspace",
    title: "Default Sandbox Terminal Shell",
    subtitle: "Command shell loaded in the interactive bottom drawer.",
    description: "Choose preferred shell environment for sandbox execution.",
    type: "select",
    options: [
      { label: "Zsh with Starship Prompt", value: "zsh" },
      { label: "Bash", value: "bash" },
      { label: "Fish Shell", value: "fish" },
    ],
    defaultValue: "zsh",
  },
  {
    id: "workspace.autoHibernationMinutes",
    category: "workspace",
    scope: "workspace",
    title: "Sandbox Inactivity Sleep Timer",
    subtitle: "Minutes of inactivity before pausing idle container resources.",
    description: "Preserves snapshot state and restores in under 2 seconds upon return.",
    type: "number",
    unit: "minutes",
    min: 5,
    max: 120,
    step: 5,
    defaultValue: 15,
  },

  // 8. NOTIFICATIONS & ALERTS
  {
    id: "notifications.emailDigest",
    category: "notifications",
    scope: "user",
    title: "Weekly Learning & Progress Digest",
    subtitle: "Receive a personalized Monday morning summary of streaks, hours, and skill gains.",
    description: "Includes recommended next steps and cohort comparison benchmarks.",
    type: "switch",
    defaultValue: true,
  },
  {
    id: "notifications.lessonReminders",
    category: "notifications",
    scope: "user",
    title: "Daily Goal Reminders",
    subtitle: "Browser or mobile notification if daily study target is pending before midnight.",
    description: "Helpful nudge sent 2 hours before your target goal cutoff.",
    type: "switch",
    defaultValue: true,
  },
  {
    id: "notifications.institutionAnnouncements",
    category: "notifications",
    scope: "user",
    title: "Institutional Announcements & Deadlines",
    subtitle: "High priority broadcasts from course instructors and team managers.",
    description: "Receive immediate alerts for assignment releases and exam schedules.",
    type: "switch",
    defaultValue: true,
  },
]

const THEME_OPTIONS = [
  {
    id: "dark-modern",
    name: "Dark Modern",
    description: "Deep obsidian backdrop with electric blue accents (Default)",
    bgClass: "bg-[#0b0f17]",
    accentClass: "bg-[#0070f3]",
    borderClass: "border-[#1e293b]",
  },
  {
    id: "midnight-navy",
    name: "LearnioX Navy",
    description: "Sophisticated midnight indigo with vibrant sapphire highlights",
    bgClass: "bg-[#090d16]",
    accentClass: "bg-[#38bdf8]",
    borderClass: "border-[#1e3a8a]/40",
  },
  {
    id: "light-modern",
    name: "Light Clean",
    description: "Crisp white background with high contrast dark typography",
    bgClass: "bg-[#ffffff]",
    accentClass: "bg-[#0284c7]",
    borderClass: "border-[#e2e8f0]",
  },
  {
    id: "cyber-emerald",
    name: "Cyber Emerald",
    description: "Stealth dark matrix with glowing neon emerald highlights",
    bgClass: "bg-[#05110e]",
    accentClass: "bg-[#10b981]",
    borderClass: "border-[#064e3b]/50",
  },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeScope, setActiveScope] = React.useState<"all" | SettingScope>("all")
  const [activeCategory, setActiveCategory] = React.useState<string>("commonly-used")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [modifiedSettings, setModifiedSettings] = React.useState<Set<string>>(new Set())

  // Load initial settings state
  const [settingsState, setSettingsState] = React.useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    ALL_SETTINGS.forEach((s) => {
      initial[s.id] = s.defaultValue
    })
    return initial
  })

  const handleSettingChange = (id: string, value: any) => {
    setSettingsState((prev) => ({ ...prev, [id]: value }))
    setModifiedSettings((prev) => {
      const next = new Set(prev)
      const setting = ALL_SETTINGS.find((s) => s.id === id)
      if (setting && setting.defaultValue === value) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    toast.success("Setting updated successfully", { duration: 1500 })
  }

  const handleResetSetting = (id: string) => {
    const item = ALL_SETTINGS.find((s) => s.id === id)
    if (item) {
      handleSettingChange(id, item.defaultValue)
      toast.info(`Reset ${item.title} to default`)
    }
  }

  const handleResetCategory = (categoryId: string) => {
    const items = ALL_SETTINGS.filter((s) => s.category === categoryId)
    setSettingsState((prev) => {
      const updated = { ...prev }
      items.forEach((item) => {
        updated[item.id] = item.defaultValue
      })
      return updated
    })
    setModifiedSettings((prev) => {
      const next = new Set(prev)
      items.forEach((item) => next.delete(item.id))
      return next
    })
    toast.success("Category settings reset to defaults")
  }

  // Active Category Meta
  const currentCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0]

  // Filter settings based on Search + Scope + Category
  const isSearching = searchQuery.trim() !== ""

  const filteredSettings = ALL_SETTINGS.filter((item) => {
    // 1. Scope filter
    if (activeScope !== "all" && item.scope !== activeScope) {
      return false
    }

    // 2. Search query filter
    if (isSearching) {
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      )
    }

    // 3. Category match
    return item.category === activeCategory
  })

  // Count items per category
  const getCategoryCount = (categoryId: string) => {
    return ALL_SETTINGS.filter((s) => {
      if (activeScope !== "all" && s.scope !== activeScope) return false
      return s.category === categoryId
    }).length
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex h-svh flex-col overflow-hidden bg-background text-foreground">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/60 px-4 sm:px-6 backdrop-blur-md">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2">
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-foreground">
                    Settings
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="sm:hidden font-bold text-sm text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-4 text-primary" />
              Settings
            </div>
          </div>

          {/* Right Action: User Menu */}
          <div className="flex items-center gap-3">
            {modifiedSettings.size > 0 && (
              <Badge variant="secondary" className="hidden sm:inline-flex text-[11px] gap-1 px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                <RefreshCw className="size-3" />
                <span>{modifiedSettings.size} modified</span>
              </Badge>
            )}
            <NavUser />
          </div>
        </header>

        {/* Sub-Header: Search & Scope Filter Toolbar */}
        <div className="border-b border-border/60 bg-card/30 px-4 sm:px-6 py-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings, preferences, models, and shortcuts..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background/90 text-xs text-foreground placeholder:text-muted-foreground shadow-xs transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Scope Tabs (All, User, Workspace, Platform) */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/60 text-xs shrink-0 self-start sm:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveScope("all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap",
                  activeScope === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Scopes
              </button>
              <button
                type="button"
                onClick={() => setActiveScope("user")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap",
                  activeScope === "user"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="size-3 text-primary" />
                User
              </button>
              <button
                type="button"
                onClick={() => setActiveScope("workspace")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap",
                  activeScope === "workspace"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Laptop className="size-3 text-emerald-500" />
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveScope("platform")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap",
                  activeScope === "platform"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="size-3 text-amber-500" />
                Platform
              </button>
            </div>
          </div>
        </div>

        {/* Main Settings 2-Column Split Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: Categories Navigation Sidebar */}
          <aside className="w-64 lg:w-72 shrink-0 border-r border-border/60 bg-card/10 p-3 overflow-y-auto no-scrollbar hidden md:block">
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Categories
              </div>

              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon
                const isSelected = activeCategory === cat.id && !isSearching
                const count = getCategoryCount(cat.id)

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id)
                      setSearchQuery("")
                    }}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer group",
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0",
                        isSelected
                          ? "bg-primary/20 text-primary font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Bottom Quick Help Card */}
            <div className="mt-8 p-3.5 rounded-xl border border-border/80 bg-card/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Configuration</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Changes made to editor font size, tab sizing, and auto-save apply instantly to all live interactive sandboxes.
              </p>
            </div>
          </aside>

          {/* RIGHT COLUMN: Settings Form & Card Feed */}
          <main className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 py-6 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Category Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSearching ? (
                      <>
                        <Search className="size-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                          Search Results
                        </h1>
                      </>
                    ) : (
                      <>
                        <currentCategoryMeta.icon className="size-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                          {currentCategoryMeta.name}
                        </h1>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isSearching
                      ? `Found ${filteredSettings.length} setting${filteredSettings.length === 1 ? "" : "s"} matching "${searchQuery}"`
                      : currentCategoryMeta.description}
                  </p>
                </div>

                {/* Reset category button */}
                {!isSearching && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleResetCategory(currentCategoryMeta.id)}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset Category</span>
                  </Button>
                )}
              </div>

              {/* Mobile Category Dropdown Selector */}
              <div className="md:hidden">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Select Category
                </label>
                <Select
                  value={activeCategory}
                  onValueChange={(val) => {
                    setActiveCategory(val)
                    setSearchQuery("")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({getCategoryCount(cat.id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Settings Card List */}
              {filteredSettings.length === 0 ? (
                <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-card/40 p-8">
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Search className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No settings found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    We could not find any settings matching your current search query or active scope filter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setActiveScope("all")
                    }}
                    className="mt-2 text-xs"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSettings.map((item) => {
                    const isModified = modifiedSettings.has(item.id)
                    const currentValue = settingsState[item.id]

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "relative rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:border-border",
                          isModified && "border-primary/40 bg-linear-to-br from-card via-card to-primary/5"
                        )}
                      >
                        {/* Top Setting Row: Title + Scope Pill */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-foreground font-sans">
                                {item.title}
                              </h3>

                              {/* Scope Badge */}
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                  item.scope === "user" && "bg-primary/10 text-primary border-primary/20",
                                  item.scope === "workspace" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                  item.scope === "platform" && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}
                              >
                                {item.scope === "user" && <User className="size-2.5" />}
                                {item.scope === "workspace" && <Laptop className="size-2.5" />}
                                {item.scope === "platform" && <Shield className="size-2.5" />}
                                <span className="capitalize">{item.scope}</span>
                              </span>

                              {/* Modified Indicator */}
                              {isModified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  <Check className="size-2.5" />
                                  Modified
                                </span>
                              )}
                            </div>

                            {item.subtitle && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Reset setting button */}
                          {isModified && (
                            <button
                              type="button"
                              onClick={() => handleResetSetting(item.id)}
                              title="Reset to default value"
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer shrink-0"
                            >
                              <RotateCcw className="size-3.5" />
                              <span className="sr-only">Reset</span>
                            </button>
                          )}
                        </div>

                        {/* Description */}
                        <div className="text-xs text-muted-foreground/90 leading-relaxed mb-4">
                          {item.description}
                        </div>

                        {/* Interactive Controls */}
                        <div className="pt-1">
                          
                          {/* 1. THEME PICKER */}
                          {item.type === "theme-picker" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                              {THEME_OPTIONS.map((theme) => {
                                const isSelected = currentValue === theme.id
                                return (
                                  <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => handleSettingChange(item.id, theme.id)}
                                    className={cn(
                                      "flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                                        : "border-border bg-background/50 hover:bg-background hover:border-border/80"
                                    )}
                                  >
                                    {/* Swatch Preview */}
                                    <div className={cn("size-8 rounded-lg border flex items-center justify-center shrink-0 shadow-inner", theme.bgClass, theme.borderClass)}>
                                      <div className={cn("size-3.5 rounded-full", theme.accentClass)} />
                                    </div>

                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground">
                                          {theme.name}
                                        </span>
                                        {isSelected && (
                                          <Check className="size-3.5 text-primary shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                                        {theme.description}
                                      </p>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* 2. SELECT DROPDOWN */}
                          {item.type === "select" && item.options && (
                            <div className="max-w-md space-y-1.5">
                              <Select
                                value={currentValue}
                                onValueChange={(val) => handleSettingChange(item.id, val)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label} {opt.description ? `— ${opt.description}` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* 3. NUMBER INPUT */}
                          {item.type === "number" && (
                            <div className="flex items-center gap-3 max-w-xs">
                              <input
                                type="number"
                                min={item.min}
                                max={item.max}
                                step={item.step || 1}
                                value={currentValue}
                                onChange={(e) => handleSettingChange(item.id, Number(e.target.value))}
                                className="w-32 h-9 px-3 text-xs bg-background border border-input rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none shadow-xs font-mono"
                              />
                              {item.unit && (
                                <span className="text-xs font-medium text-muted-foreground">
                                  {item.unit}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 4. TEXT INPUT */}
                          {item.type === "text" && (
                            <div className="max-w-lg">
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleSettingChange(item.id, e.target.value)}
                                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none shadow-xs font-mono"
                              />
                            </div>
                          )}

                          {/* 5. SWITCH TOGGLE */}
                          {item.type === "switch" && (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(currentValue)}
                                onClick={() => handleSettingChange(item.id, !currentValue)}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                  currentValue ? "bg-primary" : "bg-muted"
                                )}
                              >
                                <span
                                  className={cn(
                                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                                    currentValue ? "translate-x-5" : "translate-x-0"
                                  )}
                                />
                              </button>
                              <span className="text-xs font-medium text-foreground">
                                {currentValue ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          )}

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          </main>

        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}
