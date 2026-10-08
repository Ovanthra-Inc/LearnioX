'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/providers/ThemeProvider';
import { useCourses } from '@/hooks/useCourses';
import { SearchModal } from '@/components/search-modal';
import {
  Sun,
  Moon,
  LogIn,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Building2,
  Users,
  ShieldCheck,
  Play,
  CheckCircle2,
  Layers,
  Code,
  GraduationCap,
  ChevronRight,
  Flame,
  Clock,
  Radio,
  ExternalLink,
  Laptop,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { courses, isLoading: isCoursesLoading } = useCourses({ page: 1, pageSize: 6 });

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/courses?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      setIsSearchOpen(true);
    }
  };

  // Curated showcase fallback if backend has no initial seed
  const fallbackCourses = [
    {
      id: 'course-fullstack-devops',
      title: 'Full-Stack Microservices & Event-Driven Systems',
      subtitle: 'FastAPI, PostgreSQL 16, Redis, Docker Compose and Nginx ingress reverse proxying.',
      category: 'Cloud & Architecture',
      level: 'INTERMEDIATE',
      price: 0,
      access_type: 'FREE',
      duration: '18h 45m',
      rating: 4.9,
      students_count: 1420,
      thumbnail:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      institution: 'Ovanthra Institute of Technology',
    },
    {
      id: 'course-ai-rag-agents',
      title: 'Applied Frontier AI: Agentic Workflows & RAG Systems',
      subtitle: 'Build autonomous coding assistants, pgvector search pipelines, and multi-model SLM routers.',
      category: 'AI & Intelligence',
      level: 'ADVANCED',
      price: 89,
      access_type: 'PAID',
      duration: '26h 10m',
      rating: 5.0,
      students_count: 980,
      thumbnail:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      institution: 'Neural Systems Academy',
    },
    {
      id: 'course-k8s-infra',
      title: 'Autonomous AI DevOps & K8s Self-Healing Watchers',
      subtitle: 'Deterministic eBPF telemetry, CrashLoopBackOff triage, and GitOps drift remediation.',
      category: 'Cloud & Architecture',
      level: 'ADVANCED',
      price: 49,
      access_type: 'PAID',
      duration: '15h 30m',
      rating: 4.85,
      students_count: 750,
      thumbnail:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      institution: 'Cloud Native Collective',
    },
    {
      id: 'course-nextjs-perf',
      title: 'Production Next.js 14 & Shadcn High-Performance UI',
      subtitle: 'Zero-layout-shift SSR caching, TanStack Query v5 state sync, and Redux Toolkit auth queues.',
      category: 'Web Engineering',
      level: 'INTERMEDIATE',
      price: 0,
      access_type: 'FREE',
      duration: '12h 20m',
      rating: 4.95,
      students_count: 2150,
      thumbnail:
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      institution: 'Ovanthra Institute of Technology',
    },
    {
      id: 'course-system-design',
      title: 'Distributed Systems & High-Throughput DB Sharding',
      subtitle: 'WAL logs, Raft consensus algorithms, connection pooling, and multi-region database partitions.',
      category: 'System Design',
      level: 'ADVANCED',
      price: 99,
      access_type: 'PAID',
      duration: '30h 00m',
      rating: 4.9,
      students_count: 1100,
      thumbnail:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      institution: 'Distributed Systems Academy',
    },
    {
      id: 'course-cyber-guardrails',
      title: 'Enterprise AI Guardrails, Security & Dual-Cookie Auth',
      subtitle: 'HttpOnly cookie rotation, RBAC role scopes, token replay defense, and model output red-teaming.',
      category: 'Cybersecurity',
      level: 'INTERMEDIATE',
      price: 0,
      access_type: 'FREE',
      duration: '10h 15m',
      rating: 4.88,
      students_count: 860,
      thumbnail:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      institution: 'CyberOps University',
    },
  ];

  const displayedCourses = useMemo(() => {
    if (courses && courses.length > 0) {
      return courses.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle || c.description,
        category: c.category?.name || 'Curriculum Track',
        level: c.level || 'INTERMEDIATE',
        price: c.price,
        access_type: c.access_type || (c.price === 0 ? 'FREE' : 'PAID'),
        duration: '15h 00m',
        rating: 4.9,
        students_count: c.enrolled_count || 120,
        thumbnail:
          c.thumbnail_url ||
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        institution: c.institution?.name || 'Verified Institution Academy',
      }));
    }
    return fallbackCourses;
  }, [courses]);

  const categories = [
    { id: 'ALL', label: 'All Curricula' },
    { id: 'AI & Intelligence', label: 'AI & Machine Learning' },
    { id: 'Cloud & Architecture', label: 'Cloud & DevOps' },
    { id: 'Web Engineering', label: 'Full-Stack Web' },
    { id: 'System Design', label: 'System Architecture' },
  ];

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'ALL') return displayedCourses;
    return displayedCourses.filter((c) => c.category === selectedCategory);
  }, [displayedCourses, selectedCategory]);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary font-sans">
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* ========================================================================= */}
      {/* 1. TOP STICKY NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs group-hover:scale-105 transition-transform">
                LX
              </div>
              <span className="text-lg font-black tracking-tight text-foreground font-sans">
                Learnio<span className="text-primary">X</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground transition-colors">
                Explore Tracks
              </Link>
              <Link href="/institution" className="hover:text-foreground transition-colors">
                Institutions
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/registered" className="hover:text-foreground transition-colors">
                    My Classroom
                  </Link>
                  <Link href="/community" className="hover:text-foreground transition-colors">
                    Community
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Center Search Input Trigger */}
          <div className="hidden sm:flex flex-1 max-w-md mx-6">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 text-muted-foreground text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span>Search courses, institutions, topics...</span>
              </div>
              <kbd className="hidden lg:inline-block rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Toggle theme"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span>Start Free</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO DISCOVERY PORTAL                                                  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/60">
        {/* Architectural Ambient Grid & Glows */}
        <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 size-[550px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Eyebrow Platform Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span>Multi-Tenant Ed-Tech Operating System</span>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground font-sans leading-[1.08]">
              Where Creators Build <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Autonomous Coaching Academies
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              YouTube-scale public discovery meets Udemy course commerce and Graphy coaching studio. Complete with 14 automated AI assessment engines, classroom video playback, and Discord-style community channels.
            </p>
          </div>

          {/* Hero Instant Search Bar */}
          <form onSubmit={handleHeroSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl border border-border/90 bg-card/80 backdrop-blur-xl p-2 shadow-2xl focus-within:border-primary transition-all">
              <Search className="size-5 text-muted-foreground ml-3 shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="What do you want to learn? (e.g. Distributed Systems, FastAPI, AI Agents...)"
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none font-sans"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 shadow-sm shrink-0 cursor-pointer"
              >
                Search Tracks
              </button>
            </div>
          </form>

          {/* Quick Keyword Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">Trending Topics:</span>
            {['Autonomous Agents', 'FastAPI Microservices', 'Next.js 14', 'eBPF Telemetry', 'Docker Compose'].map((tag) => (
              <Link
                key={tag}
                href={`/courses?search=${encodeURIComponent(tag)}`}
                className="rounded-lg border border-border/80 bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/50 hover:bg-secondary transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PLATFORM METRICS BENTO STRIP                                           */}
      {/* ========================================================================= */}
      <section className="border-b border-border/60 bg-sidebar/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">100%</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Autonomous Studio
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">14 Types</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Assessment Engines
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">Zero-Lag</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cloud Video Streaming
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">Multi-Tenant</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Verified Academies
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DISCOVERY CATALOG & TRENDING FEEDS                                     */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header + Category Chips */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary font-mono">
                <Flame className="size-4 text-orange-500" />
                <span>Zone 1: Public Discovery Feed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground font-sans">
                Trending Curricula & Free Previews
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Zero-login browsing. Start watching preview lectures immediately or enroll to sync progress across all your devices.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0',
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-xl transition-all"
              >
                {/* Thumbnail with Level Tag and Free/Paid Badge */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                      {c.level}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs',
                        c.access_type === 'FREE'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {c.access_type === 'FREE' ? 'Free Preview' : `$${c.price}`}
                    </span>
                  </div>

                  {/* Play Video Trigger Overlay */}
                  <Link
                    href={`/courses/${c.id}/learn`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-2xs"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110">
                      <Play className="size-5 fill-current ml-0.5" />
                    </div>
                  </Link>

                  {/* Institution Banner at Bottom of Thumbnail */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="truncate font-medium flex items-center gap-1">
                      <Building2 className="size-3 text-primary" />
                      <span>{c.institution}</span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 shrink-0">
                      {c.duration}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-1 flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                      {c.category}
                    </span>
                    <h3 className="text-base font-bold text-foreground font-sans line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.subtitle}
                    </p>
                  </div>

                  {/* Card Bottom CTA Row */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Users className="size-3.5 text-primary" />
                      <span>{c.students_count} learners</span>
                    </div>

                    <Link
                      href={`/courses/${c.id}/learn`}
                      className="inline-flex items-center gap-1 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground px-3.5 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer"
                    >
                      <span>Enter Track</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View Full Catalog Link */}
          <div className="text-center pt-4">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground hover:bg-secondary hover:border-primary/40 transition-all shadow-xs"
            >
              <span>Explore All Verified Institution Curricula</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THE 4 PRODUCT ZONES ARCHITECTURE SHOWCASE                              */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-b border-border/60 bg-sidebar/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
              Complete Ed-Tech Operating System
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans">
              4 Integrated Product Zones
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Engineered with extreme separation of concerns. From zero-login browsing to autonomous creator operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Zone 1: Discovery */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Compass className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                1. Public Discovery
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant catalog exploration, multi-facet filtering, SEO indexed feeds, and instant video preview lessons with zero login friction.
              </p>
            </div>

            {/* Zone 2: Learner Classroom */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Play className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                2. Learner Classroom
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fluid video playlist sidebar, progress heartbeats, timestamped notes, question-and-answer threads, and automated completion certificates.
              </p>
            </div>

            {/* Zone 3: Academy Studio */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Building2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                3. Academy Studio
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                YouTube Studio-style lecture uploader, multi-step curriculum builder, Discord-like community channels, and 7-tier institution RBAC.
              </p>
            </div>

            {/* Zone 4: AI Operations */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Sparkles className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                4. AI Operations
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                14 automated assessment generators, instant code rubric evaluations, vector transcript ingestion, and 24/7 student doubt assistance.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER                                                  */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-primary/40 bg-linear-to-b from-primary/10 via-card to-card p-8 sm:p-12 text-center space-y-6 shadow-2xl overflow-hidden">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight font-sans">
                Launch Your Institution Workspace Today
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Join engineering academies, independent educators, and creator collectives scaling their teaching autonomous with LearnioX.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Create Creator Account</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto rounded-xl border border-border bg-secondary/80 px-6 py-3 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Browse Student Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ARCHITECTURAL FOOTER                                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-border/80 bg-sidebar/50 py-12 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-[11px]">
              LX
            </div>
            <span className="font-bold text-foreground">
              Learnio<span className="text-primary">X</span>
            </span>
            <span>• Multi-Tenant Ed-Tech Operating System</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link href="/institution" className="hover:text-foreground transition-colors">
              Institutions
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/registered" className="hover:text-foreground transition-colors">
                  Classroom
                </Link>
                <Link href="/community" className="hover:text-foreground transition-colors">
                  Community
                </Link>
              </>
            )}
            <a href="mailto:support@learniox.com" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>

          <div className="text-[11px]">
            © {new Date().getFullYear()} Ovanthra Inc. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
