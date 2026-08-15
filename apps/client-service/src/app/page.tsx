'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon, LogIn } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // If already authenticated, redirect straight to user dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-[calc(100vh)] w-full bg-background flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Right Corner Action Area: Theme Toggle & Login Button */}
      <header className="absolute top-0 right-0 p-6 sm:p-8 flex items-center space-x-3 z-10">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-secondary/50 text-foreground hover:bg-secondary transition-colors focus:outline-none cursor-pointer shadow-xs"
          title="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        <Link
          href="/login"
          className="inline-flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span>Log In</span>
          <LogIn className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Blank distraction-free area */}
      <div className="flex-1" />
    </div>
  );
}
