'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  Building2,
  BookOpen,
  Users,
  Award,
  Globe,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  School,
  FileText,
  BadgeCheck,
  Quote,
  Layers,
  GraduationCap,
  Microscope,
  Landmark,
  Binary,
  Cpu,
  Mail,
  ArrowUpRight,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

// Static fallback metadata for curated network partners
const CURATED_FALLBACK_DATA: Record<string, any> = {
  'helios-capital': {
    name: 'Helios Capital Management',
    tagline: 'Sustainable infrastructure & transition energy investments across emerging European markets.',
    description: 'A premier institutional center for transitional energy investments, sustainable infrastructure modeling, and yield generation frameworks across European emerging markets.',
    students_enrolled: '32k+',
    years_excellence: '28',
    global_ranking: '#8',
    placement_rate: '99%',
    logo_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&auto=format&fit=crop&q=80',
    hero_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
    research_title: 'Pioneering Clean Energy & Quantitative Finance',
    research_desc: 'Our sustainable infrastructure laboratories bring together quantitative researchers and financial engineers to accelerate clean grid deployment and yield modeling.',
  },
  'nexus-quantum': {
    name: 'Nexus Quantum Institute',
    tagline: 'Post-classical computational frameworks & quantum cybersecurity research.',
    description: 'A world-leading center for quantum algorithmic verification, post-quantum cryptographic security, and distributed computing simulation across Asian and global markets.',
    students_enrolled: '18k+',
    years_excellence: '15',
    global_ranking: '#4',
    placement_rate: '98%',
    logo_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=160&auto=format&fit=crop&q=80',
    hero_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    research_title: 'Pioneering Quantum Systems & Cryptography',
    research_desc: 'Our post-classical computation research facility provides sandbox access to simulated qubit arrays, zero-knowledge verification frameworks, and deep state research.',
  },
  'apex-urban': {
    name: 'Apex Urban Developments',
    tagline: 'Next-generation smart city grids and resilient physical networks.',
    description: 'Pioneering smart physical infrastructure, distributed IoT telemetry networks, and sustainable city architecture across rapidly growing urban centers.',
    students_enrolled: '25k+',
    years_excellence: '35',
    global_ranking: '#12',
    placement_rate: '97%',
    logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
    hero_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    research_title: 'Pioneering Urban Infrastructure & Smart Cities',
    research_desc: 'Integrating real-time sensor streams, digital twin simulation pipelines, and structural engineering to build resilient cities for the next century.',
  },
  'learniox-ai-academy': {
    name: 'LearnioX Global AI Academy',
    tagline: 'Enterprise foundational AI and full-stack software development curriculum.',
    description: 'A premier center for interdisciplinary AI research and developer mastery, dedicated to fostering innovation and engineering excellence across global multi-tenant workspaces.',
    students_enrolled: '45k+',
    years_excellence: '12',
    global_ranking: '#1',
    placement_rate: '99%',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    hero_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    research_title: 'Pioneering Autonomous Agents & Cloud Sandboxes',
    research_desc: 'Our AI research facility brings together the brightest minds in machine learning to build next-generation distributed inference pipelines and hands-on coding sandboxes.',
  },
};

const DEFAULT_METRICS = {
  students_enrolled: '25k+',
  years_excellence: '15',
  global_ranking: '#12',
  placement_rate: '98%',
};

export default function IndividualInstitutionProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [activeNav, setActiveNav] = useState<'initiatives' | 'impact' | 'research' | 'courses' | 'campus'>('initiatives');

  // 1. Lookup Institution by Slug from backend API
  const { data: instData, isLoading: isInstLoading } = useQuery({
    queryKey: ['institution-by-slug', slug],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/slug/${slug}`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(slug),
  });

  const institutionId = instData?.id;

  // 2. Fetch Compiled Landing Page Data / Statistics
  const { data: landingData } = useQuery({
    queryKey: ['institution-landing', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/landing-page`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(institutionId),
  });

  // 3. Fetch Courses for this Institution
  const { data: coursesData } = useQuery({
    queryKey: ['institution-public-courses', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/courses?page=1&limit=20`);
        return res.data;
      } catch {
        return { items: [] };
      }
    },
    enabled: Boolean(institutionId),
  });

  if (isInstLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Loading institutional profile...</span>
        </div>
      </div>
    );
  }

  // Merge API data with curated fallback values if present
  const fallback = CURATED_FALLBACK_DATA[slug] || {
    name: instData?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    tagline: instData?.tagline || 'Premier center for innovation, academic inquiry, and professional certification.',
    description: instData?.description || instData?.tagline || 'A premier center for interdisciplinary research and professional development, dedicated to fostering innovation and excellence across global networks.',
    ...DEFAULT_METRICS,
  };

  const name = instData?.name || fallback.name;
  const tagline = instData?.tagline || fallback.tagline;
  const description = instData?.description || fallback.description;
  const logoUrl = instData?.logo_url || fallback.logo_url;
  const studentsCount = landingData?.statistics?.total_students ? `${landingData.statistics.total_students}+` : fallback.students_enrolled;
  const courses = coursesData?.items || [];

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground w-full max-w-full overflow-x-hidden">
        
        {/* Top Institutional Header Navbar */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/70">
        <nav className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-7xl mx-auto w-full">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/institution"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pr-3 border-r border-border"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Network Directory</span>
            </Link>

            <Link href={`/institution/slug/${slug}`} className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="size-7 rounded-md object-cover border border-border" />
              ) : (
                <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  <Building2 className="size-4" />
                </div>
              )}
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground font-sans truncate max-w-[200px] sm:max-w-xs">
                {name}
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-6 text-xs font-medium">
            <a
              href="#initiatives"
              onClick={() => setActiveNav('initiatives')}
              className={cn(
                'transition-colors hover:text-primary py-1 border-b-2',
                activeNav === 'initiatives' ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
              )}
            >
              Initiatives
            </a>
            <a
              href="#impact"
              onClick={() => setActiveNav('impact')}
              className={cn(
                'transition-colors hover:text-primary py-1 border-b-2',
                activeNav === 'impact' ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
              )}
            >
              Impact
            </a>
            <a
              href="#research"
              onClick={() => setActiveNav('research')}
              className={cn(
                'transition-colors hover:text-primary py-1 border-b-2',
                activeNav === 'research' ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
              )}
            >
              Research
            </a>
            <Link
              href={`/institution/slug/${slug}/courses`}
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Curriculum & Tracks
            </Link>
            <a
              href="#campus"
              onClick={() => setActiveNav('campus')}
              className={cn(
                'transition-colors hover:text-primary py-1 border-b-2',
                activeNav === 'campus' ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
              )}
            >
              Facilities
            </a>
          </div>

          {/* Top CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#cta"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Apply Now
            </a>
          </div>
        </nav>
      </header>

      {/* Main Page Body */}
      <main className="flex-grow w-full max-w-full overflow-x-hidden">
        
        {/* 1. HERO SECTION */}
        <section id="initiatives" className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
          
          {/* Subtle Background Glow Spheres */}
          <div className="absolute top-1/4 right-0 -mt-12 size-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 size-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-xs">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                <BadgeCheck className="size-4 text-emerald-400" />
                <span>Verified Global Institution</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-sans leading-[1.15]">
                Advancing Knowledge, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200 font-black">
                  Shaping the Future.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 pt-3">
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer group"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <Link
                  href={`/institution/slug/${slug}/courses`}
                  className="inline-flex items-center justify-center gap-2 border border-border bg-card/60 hover:bg-card hover:border-border/80 text-foreground px-8 py-3.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <BookOpen className="size-3.5 text-muted-foreground" />
                  <span>Explore Curriculum</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Glass Card: Key Metrics */}
            <div id="impact" className="lg:col-span-5">
              <div className="rounded-3xl border border-border/80 bg-card/75 backdrop-blur-2xl p-7 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
                {/* Internal ambient radial glow */}
                <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 size-40 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

                {/* Header of card */}
                <div className="flex items-center gap-4 border-b border-border/60 pb-5 relative z-10">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                    <School className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-sans">
                      Key Metrics & Impact
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Global Standing & Cohort Telemetry
                    </p>
                  </div>
                </div>

                {/* 2x2 Stats Grid */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 relative z-10">
                  <div className="space-y-1 p-3.5 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
                      {studentsCount}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Students Enrolled
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
                      {fallback.years_excellence}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Years of Excellence
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
                      {fallback.global_ranking}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Global Ranking
                    </div>
                  </div>

                  <div className="space-y-1 p-3.5 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
                      {fallback.placement_rate}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Placement Rate
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 2. SCROLLING MARQUEE BANNER */}
        <section className="py-8 border-y border-border/60 bg-card/20 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Trusted by Leading Global Research & Enterprise Consortia
            </p>
          </div>

          {/* Infinite Marquee Track with gradient masks */}
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee space-x-12 select-none py-1">
              {[1, 2].map((iter) => (
                <div key={iter} className="flex items-center gap-12 shrink-0">
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Globe className="size-5 text-primary" />
                    <span>Global Partners</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Cpu className="size-5 text-cyan-400" />
                    <span>Research Tech Consortium</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Landmark className="size-5 text-amber-400" />
                    <span>EduFund Alliance</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Microscope className="size-5 text-emerald-400" />
                    <span>BioCorp Genetics</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Binary className="size-5 text-purple-400" />
                    <span>Quantum Systems Group</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <Shield className="size-5 text-sky-400" />
                    <span>CyberTrust Foundation</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
                    <GraduationCap className="size-5 text-indigo-400" />
                    <span>European Academic Guild</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. FEATURED RESEARCH & INITIATIVES SECTION WITH CTA */}
        <section id="research" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left: Visual Media Card */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-card group relative">
              <img
                src={fallback.hero_image || "https://images.unsplash.com/photo-1562774053-701939374585?w=1000&auto=format&fit=crop&q=80"}
                alt="Modern research campus"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </div>

            {/* Right: Text & Key Highlights */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                <span>World-Class Research Standards</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans leading-tight">
                {fallback.research_title || 'Pioneering Research Initiatives'}
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {fallback.research_desc || 'Our advanced facility brings together the brightest minds to tackle complex challenges. From sustainable energy solutions to cloud compilers, we are at the forefront of innovation.'}
              </p>

              <ul className="space-y-3.5 text-xs sm:text-sm text-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>State-of-the-art laboratories and cloud compiler sandboxes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Cross-disciplinary collaborative workspaces and live telemetry</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Industry partnerships for enterprise-grade hands-on application</span>
                </li>
              </ul>

              <div className="pt-2">
                <a
                  href="#courses"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span>Learn More About Our Programs</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* 4. CURRICULUM TRACKS SHOWCASE */}
        <section id="courses" className="py-20 bg-card/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                  Official Learning Tracks & Certifications
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Accredited engineering curriculum authored and certified directly by {name}.
                </p>
              </div>

              <Link
                href={`/institution/slug/${slug}/courses`}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>View All {name} Courses</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.length > 0 ? (
                courses.slice(0, 3).map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    className="group rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {c.level || 'BEGINNER'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Certified Track</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 font-sans">
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.subtitle || c.description || 'Engineering curriculum with hands-on coding sandboxes.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {c.price > 0 ? `$${c.price}` : 'INCLUDED IN TRACK'}
                      </span>
                      <span className="text-primary font-semibold group-hover:underline flex items-center gap-1">
                        <span>Enroll Track</span>
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                [
                  {
                    title: 'Advanced Applied Systems & Infrastructure',
                    level: 'ADVANCED',
                    desc: 'Comprehensive deep dive into scalable cloud topology, performance tuning, and resilient micro-architecture.',
                    price: 'INCLUDED IN TRACK',
                  },
                  {
                    title: 'Foundational Cloud Security & Zero-Trust',
                    level: 'INTERMEDIATE',
                    desc: 'Practical defensive sandboxes covering automated container security, policy enforcement, and crypto governance.',
                    price: 'INCLUDED IN TRACK',
                  },
                  {
                    title: 'Distributed Machine Learning & Agent Workflows',
                    level: 'EXPERT',
                    desc: 'Building autonomous agent swarms, tensor parallelism, and low-latency inference pipelines at scale.',
                    price: 'INCLUDED IN TRACK',
                  },
                ].map((track, i) => (
                  <div
                    key={i}
                    className="group rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {track.level}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Certified Track</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 font-sans">
                        {track.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {track.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {track.price}
                      </span>
                      <a href="#cta" className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                        <span>Enroll Track</span>
                        <ArrowRight className="size-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </section>

        {/* 5. CAMPUS LIFE & FACILITIES GALLERY */}
        <section id="campus" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
              Campus Life & Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Experience the vibrant community and world-class physical and virtual infrastructure that makes {name} unique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl overflow-hidden border border-border bg-card group relative">
              <img
                src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80"
                alt="Research Library"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-sm font-bold text-foreground">Digital Knowledge Center</h4>
                <p className="text-[11px] text-muted-foreground">High-speed terminal arrays and academic archives</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-card group relative">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80"
                alt="Modern Architecture"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-sm font-bold text-foreground">Executive Innovation Pavilion</h4>
                <p className="text-[11px] text-muted-foreground">Sustainable smart glass architecture</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-card group relative">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
                alt="Collaboration Area"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-sm font-bold text-foreground">Collaborative Project Incubator</h4>
                <p className="text-[11px] text-muted-foreground">Active student & faculty sandbox stations</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-card group relative">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80"
                alt="Science Lab"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-sm font-bold text-foreground">Advanced Robotics & Physics Lab</h4>
                <p className="text-[11px] text-muted-foreground">State-of-the-art telemetry instrumentation</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-card group relative lg:col-span-2">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80"
                alt="Graduation Event"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-sm font-bold text-foreground">Annual Graduation & Industry Gala</h4>
                <p className="text-[11px] text-muted-foreground">Over 5,000 certified graduates honored annually across global chapters</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS: VOICES OF EXCELLENCE */}
        <section className="py-20 sm:py-28 bg-card/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
                Voices of Excellence
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hear from the researchers, students, and leaders who shape our community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Testimonial 1 */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative shadow-xs">
                <Quote className="size-8 text-primary/20 absolute top-5 right-5 pointer-events-none" />
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-6 relative z-10">
                  "The collaborative environment here is unmatched. It fundamentally transformed how our team approaches distributed machine learning research and live sandbox verification."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/70">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                    alt="Dr. Sarah Jenkins"
                    className="size-10 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Dr. Sarah Jenkins</h4>
                    <p className="text-[11px] text-muted-foreground">Director of Applied Sciences</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative shadow-xs">
                <Quote className="size-8 text-primary/20 absolute top-5 right-5 pointer-events-none" />
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-6 relative z-10">
                  "As an enterprise partner, we value the rigorous academic foundation paired with practical sandbox engineering. Graduates consistently outpace industry benchmarks."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/70">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Michael Chen"
                    className="size-10 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Michael Chen</h4>
                    <p className="text-[11px] text-muted-foreground">CTO, Global Tech Partners</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative shadow-xs">
                <Quote className="size-8 text-primary/20 absolute top-5 right-5 pointer-events-none" />
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-6 relative z-10">
                  "The hands-on computing sandboxes and real-time faculty feedback gave me the confidence to step straight into senior systems engineering right after track completion."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/70">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
                    alt="Elena Rodriguez"
                    className="size-10 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Elena Rodriguez</h4>
                    <p className="text-[11px] text-muted-foreground">Ph.D. Fellow, Systems Engineering</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 7. CALL TO ACTION SECTION */}
        <section id="cta" className="py-24 px-4 sm:px-8 relative overflow-hidden bg-gradient-to-b from-card/40 to-background">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="size-[500px] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Enrollment & Partnerships Open</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-sans">
              Ready to Take the Next Step?
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Join a community of forward-thinkers, innovators, and leaders at {name}. Begin your journey with us today and shape the future of your field.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/auth/register"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/25 transition-all cursor-pointer"
              >
                Get Started with {name}
              </Link>
              <Link
                href="/dashboard/support"
                className="border border-border bg-card/80 hover:bg-card text-foreground px-8 py-3.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Contact Admissions & Partnerships
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border/70 bg-card/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                <Building2 className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground font-sans">
                {name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Empowering minds and accelerating progress through rigorous academic inquiry, hands-on cloud sandboxes, and strategic global partnerships.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Institutional Links
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#initiatives" className="hover:text-primary transition-colors">Initiatives & Overview</a></li>
              <li><a href="#impact" className="hover:text-primary transition-colors">Global Impact Metrics</a></li>
              <li><a href="#research" className="hover:text-primary transition-colors">Research Programs</a></li>
              <li><a href="#courses" className="hover:text-primary transition-colors">Curriculum Tracks</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Governance & Legal
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy & Data Governance</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Academic Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Accreditation Verifications</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cryptographic Certifications</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4 mt-8 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {name}. All rights reserved on LearnioX Platform.</p>
            <div className="flex items-center gap-4">
              <Link href="/institution" className="hover:text-primary transition-colors">Institutional Network</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">LearnioX Platform</Link>
            </div>
          </div>
        </div>
      </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
