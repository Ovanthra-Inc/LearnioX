'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Shield, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card text-muted-foreground mt-auto transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
              <BookOpen className="h-3 w-3" />
            </div>
            <span className="font-semibold text-foreground font-sans">
              LearnioX Platform
            </span>
            <span>© {new Date().getFullYear()} LearnioX Inc. All rights reserved.</span>
          </div>

          {/* Center System Status Indicator */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-muted-foreground">All Microservices Operational</span>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4 text-xs">
            <Link href="/courses" className="hover:text-foreground transition-colors cursor-pointer">
              Courses
            </Link>
            <Link href="/institution" className="hover:text-foreground transition-colors cursor-pointer">
              Institutions
            </Link>
            <a
              href="http://localhost:8080/gateway/routes"
              target="_blank"
              rel="noreferrer"
              className="flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Gateway API
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
