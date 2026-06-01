"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  HelpCircle,
  FileQuestion,
  ClipboardList,
  Award,
  CreditCard,
  Users,
  BarChart3,
  Megaphone,
  Bot,
  Settings,
  Image as ImageIcon,
  Video,
  ChevronDown,
  Plus,
  Tag,
  UserCheck,
  Library,
  Radio,
  LifeBuoy,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectInstitution } from "@/store/slices/institution.slice";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const STUDIO_NAV: NavItem[] = [
  { label: "Studio Home", href: "/studio/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Programs", href: "/studio/programs", icon: <Map className="w-5 h-5" /> },
  { label: "Courses", href: "/studio/courses", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Media Library", href: "/studio/media", icon: <Library className="w-5 h-5" /> },
  { label: "Students", href: "/studio/students", icon: <Users className="w-5 h-5" /> },
  { label: "Doubts", href: "/studio/doubts", icon: <HelpCircle className="w-5 h-5" />, badge: 142 },
  { label: "Quizzes", href: "/studio/quizzes", icon: <FileQuestion className="w-5 h-5" /> },
  { label: "Assignments", href: "/studio/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Certificates", href: "/studio/certificates", icon: <Award className="w-5 h-5" /> },
  { label: "Live Classes", href: "/studio/live-classes", icon: <Radio className="w-5 h-5" /> },
  { label: "Memberships", href: "/studio/memberships", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Payments", href: "/studio/payments", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Analytics", href: "/studio/analytics", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Marketing", href: "/studio/marketing", icon: <Megaphone className="w-5 h-5" /> },
  { label: "Coupons", href: "/studio/coupons", icon: <Tag className="w-5 h-5" /> },
  { label: "Team", href: "/studio/team", icon: <UserCheck className="w-5 h-5" /> },
  { label: "AI Copilot", href: "/studio/ai-copilot", icon: <Bot className="w-5 h-5" /> },
  { label: "Support Bot", href: "/studio/support-bot", icon: <LifeBuoy className="w-5 h-5" />, badge: 2 },
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
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className={cn(
            "text-label-sm px-1.5 py-0.5 min-w-[1.5rem] text-center",
            isActive ? "bg-background text-foreground" : "bg-foreground text-background"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function getSidebarLabels(type: string | undefined) {
  switch (type) {
    case "college_university":
      return {
        courses: "Syllabus Modules",
        students: "Undergraduates",
        live: "Lectures"
      };
    case "corporate_training":
      return {
        courses: "Skill Modules",
        students: "Active Employees",
        live: "Training Workshops"
      };
    case "k12_school":
      return {
        courses: "Grade Levels",
        students: "Pupils",
        live: "Virtual Homerooms"
      };
    case "workshop_seminar":
      return {
        courses: "Event Streams",
        students: "Registered Attendees",
        live: "Sessions / Panels"
      };
    case "organization":
      return {
        courses: "Programs",
        students: "Beneficiaries",
        live: "Briefings"
      };
    case "general":
    default:
      return {
        courses: "Courses",
        students: "Students",
        live: "Live Classes"
      };
  }
}

export function StudioSidebar() {
  const pathname = usePathname();
  const institution = useAppSelector((s) => s.institution.selectedInstitution);
  const userInstitutions = useAppSelector((s) => s.institution.userInstitutions);
  const dispatch = useAppDispatch();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const labels = getSidebarLabels(institution?.institutionType);

  const dynamicNav = STUDIO_NAV.map((item) => {
    if (item.label === "Courses") return { ...item, label: labels.courses };
    if (item.label === "Students") return { ...item, label: labels.students };
    if (item.label === "Live Classes") return { ...item, label: labels.live };
    return item;
  });

  return (
    <aside className="sidebar-nav">
      {/* Brand */}
      <div className="p-4 border-b border-border flex-shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 bg-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-label-md font-bold text-background">L</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-headline-sm font-bold text-foreground leading-none">LearnioX</h1>
          <p className="text-label-sm text-muted-foreground uppercase tracking-widest mt-0.5">
            Academy Studio
          </p>
        </div>
      </div>

      {/* Institution Switcher */}
      {institution && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="w-full px-4 py-3 flex items-center gap-2 border-b border-border hover:bg-surface-container transition-colors text-left"
          >
            <div className="w-6 h-6 bg-surface-container border border-border flex items-center justify-center text-label-sm font-bold flex-shrink-0">
              {institution.name.charAt(0)}
            </div>
            <span className="text-label-md uppercase tracking-wider text-foreground flex-1 truncate">
              {institution.name}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showSwitcher && "rotate-180")} />
          </button>
          {showSwitcher && userInstitutions.length > 1 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-surface border border-border shadow-lg">
              {userInstitutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => { dispatch(selectInstitution(inst.id)); setShowSwitcher(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-label-md uppercase tracking-wider hover:bg-surface-container transition-colors",
                    inst.id === institution.id ? "bg-surface-container" : ""
                  )}
                >
                  {inst.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {dynamicNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <Link href="/studio/courses" className="block w-full">
          <button className="w-full bg-foreground text-background text-label-md uppercase tracking-widest py-3 mb-3 hover:opacity-80 transition-opacity font-bold flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </Link>
        <Link
          href="/studio/settings"
          className="flex items-center gap-2 px-2 py-2 text-label-sm uppercase text-muted-foreground hover:text-foreground hover:bg-surface-container transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
