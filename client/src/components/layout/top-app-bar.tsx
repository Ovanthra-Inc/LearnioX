"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { switchToLearner, switchToStudio, switchToAdmin } from "@/store/slices/auth.slice";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopAppBarProps {
  title?: string;
  className?: string;
}

export function TopAppBar({ title, className }: TopAppBarProps) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "learner") {
      dispatch(switchToLearner());
      router.push("/learn/dashboard");
    } else if (val === "studio") {
      dispatch(switchToStudio());
      router.push("/studio/dashboard");
    } else if (val === "admin") {
      dispatch(switchToAdmin());
      router.push("/admin/dashboard");
    }
  };

  const getRoleValue = () => {
    if (!user) return "learner";
    if (user.role === "admin") return "admin";
    if (user.role === "owner" || user.role === "instructor") return "studio";
    return "learner";
  };

  return (
    <header className={cn("top-app-bar flex-shrink-0 !bg-background/80 backdrop-blur-md transition-all duration-300", className)}>
      {title && (
        <p className="text-label-md uppercase tracking-widest text-muted-foreground hidden md:block">
          {title}
        </p>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-1.5 border border-border bg-card px-2.5 h-9 transition-colors hover:border-foreground focus-within:border-foreground">
            <span className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground hidden sm:inline">Role:</span>
            <select
              value={getRoleValue()}
              onChange={handleRoleChange}
              className="bg-transparent text-label-sm uppercase font-bold tracking-wider text-foreground outline-none border-none cursor-pointer pr-3 focus:ring-0 text-xs font-sans"
            >
              <option value="learner" className="bg-background text-foreground">Learner</option>
              <option value="studio" className="bg-background text-foreground">Studio</option>
              <option value="admin" className="bg-background text-foreground">Admin</option>
            </select>
          </div>
        )}
        <button className="flex items-center justify-center w-9 h-9 border border-border hover:border-foreground transition-all text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95">
          <Search className="w-4 h-4" />
          <span className="sr-only">Search</span>
        </button>
        <button className="relative flex items-center justify-center w-9 h-9 border border-border hover:border-foreground transition-all text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-foreground"></span>
          <span className="sr-only">Notifications</span>
        </button>
        <ThemeToggle />
        {user && (
          <Link href="/learn/settings/profile" className="flex items-center gap-2 ml-2 transition-transform hover:scale-105 active:scale-95">
            <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-label-md font-bold border border-border">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
