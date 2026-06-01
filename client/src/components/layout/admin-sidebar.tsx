"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  ShieldAlert,
  Star,
  Settings,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  { label: "Institutions", href: "/admin/institutions", icon: <Building2 className="w-5 h-5" /> },
  { label: "Courses", href: "/admin/courses", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Payments", href: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Moderation", href: "/admin/moderation", icon: <ShieldAlert className="w-5 h-5" /> },
  { label: "Featured", href: "/admin/featured", icon: <Star className="w-5 h-5" /> },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: <FileText className="w-5 h-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-nav">
      {/* Brand */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <Link href="/">
          <h1 className="text-headline-md font-bold text-foreground">LearnioX</h1>
        </Link>
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest mt-1">
          Platform Admin
        </p>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <span className="badge badge-primary text-label-sm">Super Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest">
          LearnioX Admin Panel
        </p>
        <p className="text-label-sm text-muted-foreground mt-1">v1.0.0</p>
      </div>
    </aside>
  );
}
