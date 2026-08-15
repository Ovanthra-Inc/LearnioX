"use client"

import * as React from "react"
import {
  ChevronRight,
  Filter,
  ListFilter,
  Loader2,
  Search,
  Sparkles,
  SlidersHorizontal,
  Check,
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
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SettingItem {
  id: string
  category: string
  scope: "user" | "workspace" | "ide"
  title: string
  subtitle: string
  description: string
  linkText?: string
  modifiedElsewhere?: boolean
  type: "select" | "text" | "number" | "switch"
  options?: { label: string; value: string }[]
  defaultValue: string | number | boolean
}

const ALL_SETTINGS: SettingItem[] = [
  // Commonly Used / Editor & Platform Defaults
  {
    id: "files.autoSave",
    category: "Commonly Used",
    scope: "user",
    title: "Files: Auto Save",
    subtitle: "Controls auto save of editors and workspace tabs that have unsaved changes.",
    description: "Controls auto save of editors that have unsaved changes.",
    linkText: "auto save",
    type: "select",
    options: [
      { label: "off", value: "off" },
      { label: "afterDelay", value: "afterDelay" },
      { label: "onFocusChange", value: "onFocusChange" },
      { label: "onWindowChange", value: "onWindowChange" },
    ],
    defaultValue: "off",
  },
  {
    id: "editor.fontSize",
    category: "Commonly Used",
    scope: "user",
    title: "Editor: Font Size",
    subtitle: "Controls the font size in pixels for code editors and terminal panes.",
    description: "Controls the font size in pixels.",
    type: "number",
    defaultValue: 14,
  },
  {
    id: "editor.fontFamily",
    category: "Commonly Used",
    scope: "user",
    title: "Editor: Font Family",
    subtitle: "Controls the font family for code snippets and interactive sandboxes.",
    description: "Controls the font family.",
    type: "text",
    defaultValue: "Consolas, 'Courier New', monospace",
  },
  {
    id: "editor.tabSize",
    category: "Commonly Used",
    scope: "user",
    title: "Editor: Tab Size",
    subtitle: "The number of spaces a tab is equal to.",
    description: "The number of spaces a tab is equal to. This setting is overridden based on the file contents when Editor: Detect Indentation is on.",
    modifiedElsewhere: true,
    type: "number",
    defaultValue: 4,
  },
  {
    id: "editor.renderWhitespace",
    category: "Commonly Used",
    scope: "user",
    title: "Editor: Render Whitespace",
    subtitle: "Controls how the editor should render whitespace characters.",
    description: "Controls how the editor should render whitespace characters.",
    type: "select",
    options: [
      { label: "selection", value: "selection" },
      { label: "none", value: "none" },
      { label: "boundary", value: "boundary" },
      { label: "trailing", value: "trailing" },
      { label: "all", value: "all" },
    ],
    defaultValue: "selection",
  },

  // Text Editor Settings
  {
    id: "editor.lineNumbers",
    category: "Text Editor",
    scope: "user",
    title: "Editor: Line Numbers",
    subtitle: "Controls the display of line numbers in the editor margin.",
    description: "Controls the display of line numbers.",
    type: "select",
    options: [
      { label: "on", value: "on" },
      { label: "off", value: "off" },
      { label: "relative", value: "relative" },
      { label: "interval", value: "interval" },
    ],
    defaultValue: "on",
  },
  {
    id: "editor.wordWrap",
    category: "Text Editor",
    scope: "user",
    title: "Editor: Word Wrap",
    subtitle: "Controls how lines should wrap in editor buffers.",
    description: "Lines will wrap at the viewport boundary or word break.",
    type: "select",
    options: [
      { label: "off", value: "off" },
      { label: "on", value: "on" },
      { label: "wordWrapColumn", value: "wordWrapColumn" },
      { label: "bounded", value: "bounded" },
    ],
    defaultValue: "on",
  },

  // Workbench Settings
  {
    id: "workbench.colorTheme",
    category: "Workbench",
    scope: "user",
    title: "Workbench: Color Theme",
    subtitle: "Specifies the visual color theme used across the entire LearnioX interface.",
    description: "Theme applied to sidebar, editors, and dialogs.",
    type: "select",
    options: [
      { label: "Default Dark Modern", value: "dark-modern" },
      { label: "Dark High Contrast", value: "dark-high-contrast" },
      { label: "Light Modern", value: "light-modern" },
      { label: "Cyber Neon", value: "cyber-neon" },
    ],
    defaultValue: "dark-modern",
  },
  {
    id: "workbench.sidebarPosition",
    category: "Workbench",
    scope: "workspace",
    title: "Workbench: Sidebar Position",
    subtitle: "Controls whether the primary navigation sidebar appears on the left or right.",
    description: "Controls sidebar orientation.",
    type: "select",
    options: [
      { label: "left", value: "left" },
      { label: "right", value: "right" },
    ],
    defaultValue: "left",
  },

  // Features / AI & Learning
  {
    id: "ai.modelProvider",
    category: "Features",
    scope: "ide",
    title: "AI: Default Model Provider",
    subtitle: "Selects the default language model for smart coding suggestions and tutor feedback.",
    description: "Language model for interactive completions and quiz generation.",
    type: "select",
    options: [
      { label: "Claude 3.5 Sonnet (Recommended)", value: "claude-3-5-sonnet" },
      { label: "GPT-4o Omni", value: "gpt-4o" },
      { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
    ],
    defaultValue: "claude-3-5-sonnet",
  },
  {
    id: "learning.dailyGoalMinutes",
    category: "Features",
    scope: "user",
    title: "Learning: Daily Study Target",
    subtitle: "Target daily learning goal in minutes to track progress streaks.",
    description: "Target minutes per day for active coursework and exercises.",
    type: "number",
    defaultValue: 30,
  },

  // Security Settings
  {
    id: "security.cookieManagement",
    category: "Security",
    scope: "user",
    title: "Security: Dual-Cookie Session Management",
    subtitle: "Strict HttpOnly dual-cookie token storage with automated silent refresh rotation.",
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
    category: "Security",
    scope: "user",
    title: "Security: Refresh Session Lifetime (Days)",
    subtitle: "Duration before refresh token expires and requires explicit re-authentication.",
    description: "Default session lifetime for active client login cookies.",
    type: "number",
    defaultValue: 7,
  },

  // Extensions & Integrations
  {
    id: "extensions.autoUpdate",
    category: "Extensions",
    scope: "ide",
    title: "Extensions: Auto Update",
    subtitle: "Automatically check and update workspace plugins and lab environments.",
    description: "Controls automatic installation of extension updates.",
    type: "select",
    options: [
      { label: "true", value: "true" },
      { label: "false", value: "false" },
    ],
    defaultValue: "true",
  },
]

const CATEGORIES = [
  "Commonly Used",
  "Text Editor",
  "Workbench",
  "Window",
  "Features",
  "Application",
  "Security",
  "Extensions",
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeScope, setActiveScope] = React.useState<"user" | "workspace" | "ide">("user")
  const [activeCategory, setActiveCategory] = React.useState<string>("Commonly Used")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [settingsState, setSettingsState] = React.useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    ALL_SETTINGS.forEach((s) => {
      initial[s.id] = s.defaultValue
    })
    return initial
  })

  const handleSettingChange = (id: string, value: any) => {
    setSettingsState((prev) => ({ ...prev, [id]: value }))
    toast.success("Setting updated", { duration: 1500 })
  }

  // Filtered settings
  const filteredSettings = ALL_SETTINGS.filter((item) => {
    const matchesScope = activeScope === "ide" ? true : item.scope === activeScope || item.category === "Commonly Used"
    const matchesCategory = searchQuery.trim() !== "" ? true : item.category === activeCategory

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    }

    return matchesCategory
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#181818] text-[#cccccc]">
        {/* Top Navbar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#2b2b2b] bg-[#1e1e1e] px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-[#cccccc] hover:bg-[#2a2d2e] border-[#3c3c3c]" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-[#3c3c3c]"
            />
            <Breadcrumb>
              <BreadcrumbList className="text-xs text-[#cccccc]">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard" className="text-[#888888] hover:text-[#cccccc]">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-[#555555]" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-[#ffffff]">Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3">
            <NavUser />
          </div>
        </header>

        {/* Main Settings Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Search & Filter Bar */}
          <div className="p-4 pb-2 bg-[#1e1e1e] border-b border-[#2b2b2b]">
            <div className="relative flex items-center w-full max-w-4xl rounded-sm border border-[#3c3c3c] bg-[#252526] px-3 py-1.5 focus-within:border-[#007acc] focus-within:ring-1 focus-within:ring-[#007acc] transition-colors">
              <Search className="size-3.5 text-[#858585] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings"
                className="w-full bg-transparent text-xs text-[#cccccc] placeholder:text-[#858585] outline-none"
              />
              <div className="flex items-center gap-2 text-[#858585] ml-2 shrink-0">
                <button
                  type="button"
                  title="AI Recommendations"
                  className="hover:text-[#cccccc] transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-[#007acc]" />
                </button>
                <button
                  type="button"
                  title="List modified settings"
                  className="hover:text-[#cccccc] transition-colors cursor-pointer"
                >
                  <ListFilter className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Filter settings"
                  className="hover:text-[#cccccc] transition-colors cursor-pointer"
                >
                  <Filter className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Scope Tabs (User, Workspace, Antigravity IDE Settings) */}
            <div className="flex items-center gap-6 mt-3 text-xs font-medium border-b border-transparent">
              <button
                type="button"
                onClick={() => setActiveScope("user")}
                className={cn(
                  "pb-2 transition-colors cursor-pointer border-b-2",
                  activeScope === "user"
                    ? "border-[#007acc] text-[#ffffff] font-semibold"
                    : "border-transparent text-[#8e8e8e] hover:text-[#cccccc]"
                )}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setActiveScope("workspace")}
                className={cn(
                  "pb-2 transition-colors cursor-pointer border-b-2",
                  activeScope === "workspace"
                    ? "border-[#007acc] text-[#ffffff] font-semibold"
                    : "border-transparent text-[#8e8e8e] hover:text-[#cccccc]"
                )}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveScope("ide")}
                className={cn(
                  "pb-2 transition-colors cursor-pointer border-b-2",
                  activeScope === "ide"
                    ? "border-[#007acc] text-[#ffffff] font-semibold"
                    : "border-transparent text-[#8e8e8e] hover:text-[#cccccc]"
                )}
              >
                LearnioX Platform Settings
              </button>
            </div>
          </div>

          {/* Split Pane: Left Category List + Right Setting Fields */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Non-collapsible Category Menu */}
            <div className="w-56 shrink-0 border-r border-[#2b2b2b] bg-[#1e1e1e] p-3 overflow-y-auto">
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = activeCategory === cat && searchQuery.trim() === ""
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat)
                        setSearchQuery("")
                      }}
                      className={cn(
                        "w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-xs text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "font-bold text-[#ffffff] bg-[#2a2d2e]"
                          : "text-[#9d9d9d] hover:text-[#cccccc] hover:bg-[#242424]"
                      )}
                    >
                      <ChevronRight className={cn("size-3 text-[#6b6b6b] shrink-0 transition-transform", isSelected ? "text-[#cccccc]" : "")} />
                      <span className="truncate">{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Settings Form Body */}
            <div className="flex-1 p-8 overflow-y-auto bg-[#181818]">
              <div className="max-w-3xl space-y-8">
                {/* Section Title */}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#ffffff]">
                    {searchQuery.trim() !== "" ? `Search results for "${searchQuery}"` : activeCategory}
                  </h1>
                </div>

                {filteredSettings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#858585]">
                    No settings found matching your search.
                  </div>
                ) : (
                  filteredSettings.map((item) => (
                    <div key={item.id} className="space-y-2 group">
                      {/* Setting Header / Label */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-[#ffffff]">
                          {item.title}
                        </span>
                        {item.modifiedElsewhere && (
                          <span className="text-[11px] italic text-[#858585]">
                            (Modified elsewhere)
                          </span>
                        )}
                      </div>

                      {/* Description & Links */}
                      <p className="text-xs text-[#9d9d9d] leading-relaxed">
                        {item.description.includes(item.linkText || "") && item.linkText ? (
                          <>
                            {item.description.split(item.linkText)[0]}
                            <span className="text-[#3794ff] hover:underline cursor-pointer">
                              {item.linkText}
                            </span>
                            {item.description.split(item.linkText)[1]}
                          </>
                        ) : (
                          item.description
                        )}
                      </p>

                      {/* Controls */}
                      <div className="pt-1 max-w-lg">
                        {item.type === "select" && item.options && (
                          <div className="relative">
                            <select
                              value={settingsState[item.id]}
                              onChange={(e) => handleSettingChange(item.id, e.target.value)}
                              className="w-full h-8 px-3 py-1 text-xs bg-[#3c3c3c] hover:bg-[#444444] border border-[#3c3c3c] text-[#ffffff] rounded-xs outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] cursor-pointer appearance-none"
                            >
                              {item.options.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-[#252526] text-[#ffffff]">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#cccccc]">
                              <svg className="size-3 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {item.type === "number" && (
                          <input
                            type="number"
                            value={settingsState[item.id]}
                            onChange={(e) => handleSettingChange(item.id, Number(e.target.value))}
                            className="w-48 h-8 px-3 py-1 text-xs bg-[#3c3c3c] border border-[#3c3c3c] text-[#ffffff] rounded-xs outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                          />
                        )}

                        {item.type === "text" && (
                          <input
                            type="text"
                            value={settingsState[item.id]}
                            onChange={(e) => handleSettingChange(item.id, e.target.value)}
                            className="w-full h-8 px-3 py-1 text-xs bg-[#3c3c3c] border border-[#3c3c3c] text-[#ffffff] rounded-xs outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
