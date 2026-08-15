'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  Sun,
  Moon,
  Search,
  BookOpen,
  User as UserIcon,
  LogOut,
  Shield,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !pathname) {
    return null;
  }

  // Hide header on landing page, on auth pages, and on sidebar dashboard routes
  const authRoutes = ['/login', '/forgot-password', '/reset-password', '/verify-email'];
  if (
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/auth') ||
    authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
  ) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Main Navigation */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground font-sans">
              Learnio<span className="text-primary font-bold">X</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <Link
              href="/courses"
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Explore Courses
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              My Learning
            </Link>
            <Link
              href="/institution"
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Institutions
            </Link>
          </nav>
        </div>

        {/* Center: Global Search Launcher */}
        <div className="hidden sm:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, modules, topics... (Press Enter)"
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </form>
        </div>

        {/* Right: Theme Toggle & User Profile Menu */}
        <div className="flex items-center space-x-3">
          {/* GitHub-Inspired Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-secondary/50 text-foreground hover:bg-secondary transition-colors focus:outline-none cursor-pointer"
            title="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 rounded-md border border-input bg-secondary/30 p-1.5 hover:bg-secondary transition-colors focus:outline-none cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-foreground max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    My Learning Dashboard
                  </Link>
                  <Link
                    href="/courses"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    Explore Courses
                  </Link>
                  <Link
                    href="/institution"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    Institutions
                  </Link>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                      toast.info('Signed out successfully');
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

