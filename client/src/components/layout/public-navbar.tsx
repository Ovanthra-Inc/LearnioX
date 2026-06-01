"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Search, 
  Menu, 
  X,
  Cpu,
  Globe,
  Eye,
  Shield,
  Rocket,
  Box,
  Palette,
  BookOpen,
  FileText,
  Newspaper,
  Calendar,
  Layers,
  Video,
  Sparkles,
  UserCheck,
  Award
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";
import { DropdownNavigation } from "@/components/ui/dorpdown-navigation";

const CATEGORIES = [
  { label: "Computer Science", href: "/category/computer-science" },
  { label: "Data & AI", href: "/category/data-analytics" },
  { label: "Design", href: "/category/design" },
  { label: "Government Exams", href: "/category/government-exams" },
  { label: "JEE / NEET", href: "/category/jee-neet" },
  { label: "Business", href: "/category/business" },
];

const NAV_ITEMS = [
  {
    id: 1,
    label: "Courses",
    subMenus: [
      {
        title: "Computer Science",
        items: [
          { label: "Previews", description: "Learn 6x faster with previews", icon: Cpu },
          { label: "Coding Academy", description: "Advanced Web App tracks", icon: Rocket },
        ],
      },
      {
        title: "Data & AI",
        items: [
          { label: "AI & ML", description: "Powering breakthroughs", icon: Search },
          { label: "Observability", description: "Trace model weights", icon: Eye },
        ],
      },
      {
        title: "Design & Arts",
        items: [
          { label: "Design Systems", description: "TypeScript Storybook UIs", icon: Palette },
          { label: "Typography", description: "Structural layout hierarchy", icon: Box },
        ],
      },
      {
        title: "Government Prep",
        items: [
          { label: "UPSC Civil Services", description: "Complete syllabus prep", icon: Shield },
          { label: "SSC Exams", description: "Speed test papers", icon: FileText },
        ],
      },
      {
        title: "JEE / NEET",
        items: [
          { label: "JEE Advanced", description: "Physics Wallah prep style", icon: Globe },
          { label: "NEET Biology", description: "Dynamic video labs", icon: Cpu },
        ],
      },
      {
        title: "Language & Professional",
        items: [
          { label: "Spoken English", description: "Daily practice paths", icon: BookOpen },
          { label: "Finance & Accounting", description: "Business administration", icon: Globe },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Business",
    subMenus: [
      {
        title: "Solutions",
        items: [
          { label: "B2B Coaching", description: "Coaching platforms for teams", icon: Box },
          { label: "Marketing", description: "Launch campaigns fast", icon: Rocket },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Institutions",
    subMenus: [
      {
        title: "Find & Verify",
        items: [
          { label: "Directory", description: "Discover trusted academies", icon: BookOpen },
          { label: "Certifications", description: "Verify student badges", icon: Award },
          { label: "Partner Finder", description: "Find solution teams", icon: UserCheck },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Live Batches",
    subMenus: [
      {
        title: "Schedules",
        items: [
          { label: "Upcoming Q&A", description: "Live interactive classrooms", icon: Calendar },
          { label: "Dynamic Timetable", description: "Weekly calendar views", icon: Layers },
        ],
      },
    ],
  },
  {
    id: 5,
    label: "Free Videos",
    subMenus: [
      {
        title: "Learning Hub",
        items: [
          { label: "Free Videos Hub", description: "Browse preview lessons", icon: Video },
          { label: "NumPy Workshop", description: "Advanced live recordings", icon: Sparkles },
        ],
      },
    ],
  },
];

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 transition-transform active:scale-95 duration-100">
          <h1 className="text-headline-md font-bold text-foreground leading-none hover:opacity-80 transition-opacity">LearnioX</h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 flex-1">
          <DropdownNavigation navItems={NAV_ITEMS} />
        </nav>

        {/* Search box — Desktop */}
        <div className="hidden md:flex items-center flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search courses, institutions..."
              className="bg-surface-container border border-border pl-9 pr-4 h-9 text-body-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground transition-colors w-64"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="hidden md:inline-flex items-center px-4 h-9 border border-border text-label-md uppercase tracking-wider text-foreground hover:border-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="hidden md:inline-flex items-center px-4 h-9 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Get Started
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center border border-border"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border animate-fade-in">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search courses..."
                className="w-full bg-surface-container border border-border pl-9 pr-4 h-10 text-body-sm outline-none focus:border-foreground transition-colors"
              />
            </div>
            <nav className="flex flex-col gap-0.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 text-label-md uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
              <Link href="/institutions" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-label-md uppercase tracking-wider text-foreground hover:bg-surface-container">Institutions</Link>
              <Link href="/live-batches" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-label-md uppercase tracking-wider text-foreground hover:bg-surface-container">Live Batches</Link>
              <Link href="/free-videos" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-label-md uppercase tracking-wider text-foreground hover:bg-surface-container">Free Videos</Link>
            </nav>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
              <Link href="/auth/login" className="flex items-center justify-center h-10 border border-border text-label-md uppercase tracking-wider text-foreground">
                Sign In
              </Link>
              <Link href="/auth/signup" className="flex items-center justify-center h-10 bg-foreground text-background text-label-md uppercase tracking-wider">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
