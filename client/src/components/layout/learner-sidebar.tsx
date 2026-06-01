"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Play,
  StickyNote,
  HelpCircle,
  FileQuestion,
  ClipboardList,
  Award,
  CreditCard,
  Bookmark,
  Building2,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const LEARNER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/learn/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Courses", href: "/learn/courses", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Continue Learning", href: "/learn/courses", icon: <Play className="w-5 h-5" /> },
  { label: "Saved Courses", href: "/learn/saved", icon: <Bookmark className="w-5 h-5" /> },
  { label: "Notes", href: "/learn/notes", icon: <StickyNote className="w-5 h-5" /> },
  { label: "Doubts", href: "/learn/doubts", icon: <HelpCircle className="w-5 h-5" /> },
  { label: "Tests", href: "/learn/tests", icon: <FileQuestion className="w-5 h-5" /> },
  { label: "Assignments", href: "/learn/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Certificates", href: "/learn/certificates", icon: <Award className="w-5 h-5" /> },
  { label: "Memberships", href: "/learn/memberships", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Following", href: "/learn/following", icon: <Building2 className="w-5 h-5" /> },
  { label: "Notifications", href: "/learn/notifications", icon: <Bell className="w-5 h-5" /> },
];

const LEARNER_FOOTER_NAV: NavItem[] = [
  { label: "Settings", href: "/learn/settings/profile", icon: <Settings className="w-4 h-4" /> },
  { label: "Billing", href: "/learn/billing", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Logout", href: "/auth/login", icon: <LogOut className="w-4 h-4" /> },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-150 text-label-md uppercase tracking-wider",
        isActive
          ? "bg-foreground text-background font-bold"
          : "text-foreground hover:bg-surface-container"
      )}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function LearnerSidebar() {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <aside className="sidebar-nav">
      {/* Brand */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <Link href="/">
          <h1 className="text-headline-md font-bold text-foreground">LearnioX</h1>
        </Link>
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest mt-1">
          My Learning
        </p>
      </div>

      {/* User Greeting */}
      {user && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-surface-container border border-border flex items-center justify-center text-label-md font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-label-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {LEARNER_NAV.map((item) => (
          <NavLink
            key={item.href + item.label}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <Link href="/pricing" className="block w-full">
          <button className="w-full bg-foreground text-background text-label-md uppercase tracking-widest py-3 mb-3 hover:opacity-80 transition-opacity font-bold flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Upgrade Plan
          </button>
        </Link>
        <div className="flex flex-col gap-0.5">
          {LEARNER_FOOTER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-2 py-2 text-label-sm uppercase text-muted-foreground hover:text-foreground hover:bg-surface-container transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
