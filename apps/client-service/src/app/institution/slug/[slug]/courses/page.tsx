'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  Building2,
  Search,
  CheckCircle2,
  BadgeCheck,
  Globe,
  ArrowRight,
  Shield,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  GraduationCap,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  X,
  Flame,
  Award,
  Layers,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface InstitutionCourse {
  id: string;
  title: string;
  slug?: string;
  subtitle: string;
  description?: string;
  category: 'Technology' | 'Science' | 'Business' | 'Security' | 'AI & Cloud';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  rating: number;
  reviewsCount: number;
  instructor: string;
  price: number;
  is_featured?: boolean;
  image_url?: string;
  badge?: string;
}

// Curated courses per institutional partner
const INSTITUTION_COURSE_CATALOGS: Record<string, InstitutionCourse[]> = {
  'nexus-quantum': [
    {
      id: 'nq-1',
      title: 'Advanced Quantum Computing',
      subtitle: 'Dive deep into quantum algorithms, error correction, and near-term quantum hardware. Designed for researchers and engineers pushing computational physics.',
      category: 'Technology',
      level: 'Advanced',
      duration: '12 Weeks',
      rating: 4.9,
      reviewsCount: 1240,
      instructor: 'Prof. Michael Chen, PhD',
      price: 899,
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'nq-2',
      title: 'Post-Quantum Cryptography & Zero-Knowledge Proofs',
      subtitle: 'Lattice-based cryptography, multivariate polynomials, and post-quantum key encapsulation for secure enterprise channels.',
      category: 'Security',
      level: 'Advanced',
      duration: '10 Weeks',
      rating: 4.8,
      reviewsCount: 890,
      instructor: 'Dr. Elena Rostova',
      price: 650,
      image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      badge: 'Popular',
    },
    {
      id: 'nq-3',
      title: 'Nanotechnology in Quantum Circuit Fabrication',
      subtitle: 'Cleanroom manufacturing techniques, superconducting transmon qubits, and cryogenic telemetry systems.',
      category: 'Science',
      level: 'Intermediate',
      duration: '8 Weeks',
      rating: 4.9,
      reviewsCount: 620,
      instructor: 'Dr. Sarah Jenkins',
      price: 499,
      image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
      badge: 'New',
    },
    {
      id: 'nq-4',
      title: 'Quantum State Simulation & Qubit Arrays',
      subtitle: 'Simulating multi-qubit entanglement registers with high-performance C++ and Python state vectors.',
      category: 'Technology',
      level: 'Intermediate',
      duration: '6 Weeks',
      rating: 4.7,
      reviewsCount: 410,
      instructor: 'Dr. Aris Thorne',
      price: 399,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'nq-5',
      title: 'Quantum Complexity Theory & Algorithmic Supremacy',
      subtitle: 'BQP vs NP complexity classes, Shor and Grover algorithm verification, and fault-tolerant benchmarking.',
      category: 'Science',
      level: 'Advanced',
      duration: '14 Weeks',
      rating: 4.9,
      reviewsCount: 780,
      instructor: 'Prof. Michael Chen, PhD',
      price: 750,
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      badge: 'Highly Rated',
    },
  ],
  'helios-capital': [
    {
      id: 'hc-1',
      title: 'Sustainable Infrastructure & Transition Energy Yield Modeling',
      subtitle: 'Quantitative modeling for renewable microgrids, battery storage farms, and cross-border energy tariffs in emerging markets.',
      category: 'Business',
      level: 'Advanced',
      duration: '12 Weeks',
      rating: 4.9,
      reviewsCount: 940,
      instructor: 'Marcus Vance, CFA',
      price: 899,
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'hc-2',
      title: 'Algorithmic Trading & Energy Derivatives',
      subtitle: 'High-frequency spot market optimization, automated hedging pipelines, and stochastic volatility modeling.',
      category: 'Business',
      level: 'Advanced',
      duration: '8 Weeks',
      rating: 4.8,
      reviewsCount: 1120,
      instructor: 'Elena Rostova, PhD',
      price: 750,
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
      badge: 'Popular',
    },
    {
      id: 'hc-3',
      title: 'Decentralized Carbon Credit Registries',
      subtitle: 'Auditing and issuing cryptographically verified carbon mitigation credits using smart contracts.',
      category: 'Technology',
      level: 'Intermediate',
      duration: '6 Weeks',
      rating: 4.7,
      reviewsCount: 530,
      instructor: 'Dr. Sarah Jenkins',
      price: 499,
      image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
      badge: 'New',
    },
  ],
  'apex-urban': [
    {
      id: 'au-1',
      title: 'Smart City Grids & Distributed IoT Telemetry',
      subtitle: 'Designing real-time traffic monitoring, resilient physical grids, and edge analytics for modern metropolitan corridors.',
      category: 'Technology',
      level: 'Advanced',
      duration: '12 Weeks',
      rating: 4.9,
      reviewsCount: 1450,
      instructor: 'Eng. Carlos Mendoza',
      price: 699,
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'au-2',
      title: 'Digital Twin Simulation & Urban Infrastructure',
      subtitle: 'Building spatial simulations with Unreal Engine and real-time GIS telemetry feeds for structural integrity.',
      category: 'Science',
      level: 'Intermediate',
      duration: '8 Weeks',
      rating: 4.8,
      reviewsCount: 820,
      instructor: 'Dr. Sarah Jenkins',
      price: 550,
      image_url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
      badge: 'Popular',
    },
  ],
  'learniox-ai-academy': [
    {
      id: 'la-1',
      title: 'Full-Stack Multi-Tenant Microservices & AI Engineering',
      subtitle: 'Build production enterprise platforms with Next.js 14, Python FastAPI, PostgreSQL, Redis, and LangChain agents.',
      category: 'AI & Cloud',
      level: 'Advanced',
      duration: '14 Weeks',
      rating: 5.0,
      reviewsCount: 2840,
      instructor: 'LearnioX Lead Architects',
      price: 799,
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'la-2',
      title: 'Applied AI, LLMs & Retrieval Augmented Generation (RAG)',
      subtitle: 'Enterprise embeddings, vector databases, LangChain pipelines, fine-tuning, and multi-agent coordination.',
      category: 'AI & Cloud',
      level: 'Advanced',
      duration: '10 Weeks',
      rating: 4.9,
      reviewsCount: 1980,
      instructor: 'Dr. Sarah Jenkins',
      price: 599,
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      badge: 'Popular',
    },
    {
      id: 'la-3',
      title: 'High-Performance Cloud DevOps & Container Sandboxes',
      subtitle: 'Kubernetes orchestration, Nginx ingress proxy topologies, CI/CD automated deployment, and live compiler drawers.',
      category: 'Technology',
      level: 'Intermediate',
      duration: '8 Weeks',
      rating: 4.8,
      reviewsCount: 1420,
      instructor: 'Prof. Michael Chen, PhD',
      price: 499,
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      badge: 'New',
    },
  ],
};

const DEFAULT_COURSES: InstitutionCourse[] = [
  {
    id: 'def-1',
    title: 'Advanced Applied Systems & Infrastructure',
    subtitle: 'Comprehensive deep dive into scalable cloud topology, performance tuning, and resilient micro-architecture.',
    category: 'Technology',
    level: 'Advanced',
    duration: '12 Weeks',
    rating: 4.9,
    reviewsCount: 950,
    instructor: 'Faculty Engineering Lead',
    price: 499,
    is_featured: true,
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'def-2',
    title: 'Foundational Cloud Security & Zero-Trust',
    subtitle: 'Practical defensive sandboxes covering automated container security, policy enforcement, and crypto governance.',
    category: 'Security',
    level: 'Intermediate',
    duration: '8 Weeks',
    rating: 4.8,
    reviewsCount: 680,
    instructor: 'Dr. Sarah Jenkins',
    price: 399,
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    badge: 'Popular',
  },
  {
    id: 'def-3',
    title: 'Distributed Machine Learning & Agent Workflows',
    subtitle: 'Building autonomous agent swarms, tensor parallelism, and low-latency inference pipelines at scale.',
    category: 'AI & Cloud',
    level: 'Advanced',
    duration: '10 Weeks',
    rating: 4.9,
    reviewsCount: 1120,
    instructor: 'Prof. Michael Chen, PhD',
    price: 599,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    badge: 'Highly Rated',
  },
];

const CATEGORIES = ['All', 'Technology', 'Science', 'Business', 'Security', 'AI & Cloud'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function InstitutionCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Fetch institution profile info
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

  // 2. Fetch courses from backend API for this institution
  const { data: apiCoursesData } = useQuery({
    queryKey: ['institution-courses-list', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/courses?page=1&limit=50`);
        return res.data;
      } catch {
        return { items: [] };
      }
    },
    enabled: Boolean(institutionId),
  });

  // Institution title and metadata
  const institutionName = instData?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const logoUrl = instData?.logo_url || '';

  // Get curated courses or real courses
  const catalogCourses = useMemo<InstitutionCourse[]>(() => {
    const rawList = apiCoursesData?.items || [];
    const curatedList = INSTITUTION_COURSE_CATALOGS[slug] || DEFAULT_COURSES;

    if (rawList.length > 0) {
      const mapped: InstitutionCourse[] = rawList.map((c: any) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle || c.description || 'Comprehensive curriculum with hands-on labs.',
        category: (c.category as any) || 'Technology',
        level: (c.level as any) || 'Intermediate',
        duration: '10 Weeks',
        rating: 4.9,
        reviewsCount: 120,
        instructor: c.instructor_name || institutionName,
        price: c.price || 0,
        is_featured: false,
        image_url: c.thumbnail_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      }));

      // Combine with featured course if present
      if (curatedList.length > 0 && curatedList[0].is_featured) {
        return [curatedList[0], ...mapped];
      }
      return mapped;
    }

    return curatedList;
  }, [apiCoursesData, slug, institutionName]);

  // Extract featured course for Hero section
  const featuredCourse = useMemo(() => {
    return catalogCourses.find((c) => c.is_featured) || catalogCourses[0];
  }, [catalogCourses]);

  // Filter courses by search, category, and level
  const filteredCourses = useMemo(() => {
    let result = catalogCourses.filter((course) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(q);
        const matchesSub = course.subtitle.toLowerCase().includes(q);
        const matchesInst = course.instructor.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesInst) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && course.category !== selectedCategory) {
        return false;
      }

      // 3. Level Filter
      if (selectedLevel !== 'All' && course.level.toLowerCase() !== selectedLevel.toLowerCase()) {
        return false;
      }

      return true;
    });

    // Sort result
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [catalogCourses, searchQuery, selectedCategory, selectedLevel, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedLevel !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSortBy('relevance');
    setCurrentPage(1);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground w-full max-w-full overflow-x-hidden">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/70">
        <div className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-7xl mx-auto w-full">
          
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <Link
              href={`/institution/slug/${slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pr-3 border-r border-border"
            >
              <ChevronLeft className="size-4" />
              <span>{institutionName} Profile</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground font-sans uppercase">
                {institutionName}
              </span>
              <span className="text-muted-foreground text-xs hidden sm:inline">/ Course Discovery</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
            <Link href={`/institution/slug/${slug}#initiatives`} className="text-muted-foreground hover:text-foreground transition-colors">
              Initiatives
            </Link>
            <Link href={`/institution/slug/${slug}#impact`} className="text-muted-foreground hover:text-foreground transition-colors">
              Impact
            </Link>
            <Link href={`/institution/slug/${slug}#research`} className="text-muted-foreground hover:text-foreground transition-colors">
              Research
            </Link>
            <Link href={`/institution/slug/${slug}/courses`} className="text-primary font-bold border-b-2 border-primary pb-1">
              Curriculum Tracks
            </Link>
            <Link href={`/institution/slug/${slug}#campus`} className="text-muted-foreground hover:text-foreground transition-colors">
              Facilities
            </Link>
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/support"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-opacity"
            >
              Contact Us
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-full overflow-x-hidden">
        
        {/* 1. HERO SECTION: FEATURED COURSE SHOWCASE */}
        {featuredCourse && (
          <section className="relative w-full min-h-[520px] lg:h-[580px] flex items-center bg-card/90 overflow-hidden border-b border-border/80">
            {/* High-res Background Image with Dynamic Tech Artwork */}
            <div className="absolute inset-0 z-0">
              <img
                src={featuredCourse.image_url || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600&auto=format&fit=crop&q=80"}
                alt={featuredCourse.title}
                className="w-full h-full object-cover opacity-35"
              />
              {/* Gradient Overlays for High Legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full py-16">
              <div className="max-w-2xl space-y-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/15 text-primary font-bold text-xs border border-primary/30 tracking-wide uppercase">
                  <Sparkles className="size-3.5" />
                  <span>Featured Course Track</span>
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans leading-tight">
                  {featuredCourse.title}
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  {featuredCourse.subtitle}
                </p>

                {/* 3 Metric Pills */}
                <div className="flex flex-wrap gap-5 text-muted-foreground text-xs sm:text-sm font-medium pt-1">
                  <div className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1.5 rounded-lg">
                    <Clock className="size-4 text-primary" />
                    <span>{featuredCourse.duration}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1.5 rounded-lg">
                    <GraduationCap className="size-4 text-emerald-400" />
                    <span className="capitalize">{featuredCourse.level} Level</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1.5 rounded-lg">
                    <Star className="size-4 text-amber-400 fill-amber-400" />
                    <span className="text-foreground font-semibold">{featuredCourse.rating}</span>
                    <span className="text-muted-foreground">({featuredCourse.reviewsCount} Reviews)</span>
                  </div>
                </div>

                {/* Hero CTAs */}
                <div className="flex flex-wrap gap-3.5 pt-3">
                  <Link
                    href={`/courses/${featuredCourse.id}`}
                    className="px-7 py-3 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
                  >
                    Enroll Now (${featuredCourse.price})
                  </Link>
                  <a
                    href="#catalog"
                    className="px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    View Syllabus & Tracks
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. FLOATING CENTRAL SEARCH BAR */}
        <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-8 -mt-7 relative z-20 w-full">
          <div className="bg-card/90 border border-border rounded-2xl p-2 shadow-xl backdrop-blur-xl flex items-center">
            <Search className="size-5 text-muted-foreground pl-3 pr-1 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search courses, curriculum subjects, or instructors..."
              className="flex-grow bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none text-xs sm:text-sm py-2.5 px-3"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground mr-2 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
            <Button
              type="button"
              className="px-6 py-2 rounded-xl text-xs font-bold shadow-xs shrink-0 cursor-pointer hidden sm:flex"
            >
              Search
            </Button>
          </div>
        </section>

        {/* 3. MAIN BODY: 2-COLUMN LAYOUT (FILTERS + COURSE GRID) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 w-full flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Sidebar: Filters */}
          <aside className="w-full md:w-64 shrink-0 space-y-6 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground font-sans">Filters</h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Category
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer',
                        isSelected
                          ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <span>{cat}</span>
                      {isSelected && <Check className="size-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2.5 pt-4 border-t border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Difficulty Level
              </h3>
              <div className="space-y-1.5">
                {LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setSelectedLevel(lvl);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer',
                        isSelected
                          ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <span>{lvl === 'All' ? 'All Levels' : lvl}</span>
                      {isSelected && <Check className="size-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Main Grid: Course Cards Feed */}
          <div className="flex-1 w-full flex flex-col">
            
            {/* Header: Results Count & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <span className="text-xs text-muted-foreground">
                Showing <strong>{filteredCourses.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</strong> of <strong>{filteredCourses.length}</strong> results for {institutionName}
              </span>

              {/* Sort By Dropdown using Shadcn Select */}
              <div className="w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort by: Relevance</SelectItem>
                    <SelectItem value="rating">Sort by: Highest Rating</SelectItem>
                    <SelectItem value="price-low">Sort by: Price (Low to High)</SelectItem>
                    <SelectItem value="price-high">Sort by: Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
                <BookOpen className="size-10 mx-auto text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">No matching courses found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search query or reset category and difficulty level filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs mt-2"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {paginatedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col hover:border-primary/50 transition-all duration-300 shadow-xs hover:shadow-md group"
                  >
                    {/* Course Card Thumbnail */}
                    <div className="h-44 w-full bg-muted relative overflow-hidden">
                      <img
                        src={course.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Star Rating Badge */}
                      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1 border border-border/60 text-xs font-bold text-foreground shadow-xs">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span>{course.rating}</span>
                      </div>

                      {course.badge && (
                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs uppercase">
                          {course.badge}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-primary uppercase tracking-wider">
                            {course.category}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {course.duration}
                          </span>
                        </div>

                        <h3 className="text-base font-bold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors font-sans">
                          {course.title}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {course.subtitle}
                        </p>

                        <div className="text-[11px] text-muted-foreground/80 font-medium pt-1">
                          By <span className="text-foreground font-semibold">{course.instructor}</span>
                        </div>
                      </div>

                      {/* Card Footer: Price & Details Action */}
                      <div className="flex items-center justify-between pt-3.5 border-t border-border/60">
                        <span className="text-base font-extrabold text-foreground">
                          {course.price > 0 ? `$${course.price}` : 'FREE'}
                        </span>
                        <Link
                          href={`/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Details</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredCourses.length > 0 && (
              <div className="flex justify-center items-center gap-2 mt-auto pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'size-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                          : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}

          </div>
        </section>

        {/* 4. BOTTOM FEATURED SECTION: RECOMMENDED FOR YOU */}
        <section className="bg-card/20 py-16 w-full border-t border-border/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-6">
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
                Recommended by {institutionName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Advanced Applied Systems & Cloud Computing',
                  category: 'Technology',
                  badge: 'Popular',
                  image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
                },
                {
                  title: 'Quantum State Simulation & Cryogenic Systems',
                  category: 'Science',
                  badge: 'New',
                  image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80',
                },
                {
                  title: 'Zero-Trust Architecture & Multi-Tenant Governance',
                  category: 'Security',
                  badge: 'Highly Rated',
                  image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80',
                },
              ].map((rec, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl border border-border/80 overflow-hidden flex relative group hover:border-primary/50 transition-all shadow-xs h-32 cursor-pointer"
                >
                  <div className="w-32 h-full shrink-0 overflow-hidden">
                    <img
                      src={rec.image}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-center flex-grow space-y-1">
                    <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors font-sans">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{rec.category}</p>
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1 pt-0.5">
                      <TrendingUp className="size-3" />
                      <span>{rec.badge}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border/70 bg-card/40 mt-auto py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                <Building2 className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground font-sans">
                {institutionName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {institutionName}. All rights reserved.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 text-xs text-muted-foreground">
            <div className="flex flex-col gap-2.5">
              <Link href={`/institution/slug/${slug}`} className="hover:text-primary transition-colors">Institutional Overview</Link>
              <Link href={`/institution/slug/${slug}#research`} className="hover:text-primary transition-colors">Research Initiatives</Link>
              <Link href={`/institution/slug/${slug}/courses`} className="hover:text-primary transition-colors">Curriculum Catalog</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="hover:text-primary transition-colors">Accessibility Standards</a>
              <a href="#" className="hover:text-primary transition-colors">Security Governance</a>
              <Link href="/institution" className="hover:text-primary transition-colors">Global Directory</Link>
            </div>
          </div>
        </div>
      </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
