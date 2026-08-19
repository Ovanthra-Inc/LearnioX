'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  Building2,
  Search,
  CheckCircle2,
  BadgeCheck,
  Globe,
  ArrowRight,
  Plus,
  Loader2,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  X,
  TrendingUp,
  Cpu,
  Atom,
  Leaf,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { NavUser } from '@/components/nav-user';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InstitutionItem {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  status?: string;
  logo_url?: string;
  sector?: string;
  specialization?: string;
  region?: string;
  capital_managed?: string;
  active_projects?: number;
  partner_since?: number;
  is_verified?: boolean;
  is_user_owned?: boolean;
}

// Curated network institutions for enterprise discovery
const CURATED_DISCOVERY_INSTITUTIONS: InstitutionItem[] = [
  {
    id: "helios-capital",
    name: "Helios Capital Management",
    slug: "helios-capital",
    tagline: "Sustainable infrastructure & transition energy investments across emerging European markets.",
    description: "Driving transitional energy investments across emerging European markets with a focus on sustainable infrastructure, solar microgrids, and long-term yield generation.",
    status: "Active Deployment",
    logo_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&auto=format&fit=crop&q=80",
    sector: "Investment",
    specialization: "Renewable Energy",
    region: "EMEA",
    capital_managed: "$1.2B",
    active_projects: 24,
    partner_since: 2018,
    is_verified: true,
  },
  {
    id: "nexus-quantum",
    name: "Nexus Quantum Institute",
    slug: "nexus-quantum",
    tagline: "Post-classical computational frameworks & quantum cybersecurity research.",
    description: "Pioneering post-classical computational frameworks for secure financial modeling, distributed cryptographic proofs, and complex systems simulation in Asian markets.",
    status: "Strategic Review",
    logo_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=160&auto=format&fit=crop&q=80",
    sector: "Research",
    specialization: "Quantum Computing",
    region: "APAC",
    capital_managed: "$850M",
    active_projects: 12,
    partner_since: 2021,
    is_verified: true,
  },
  {
    id: "apex-urban",
    name: "Apex Urban Developments",
    slug: "apex-urban",
    tagline: "Next-generation smart city grids and resilient physical networks.",
    description: "Developing next-generation smart city grids, sensor telemetry systems, and resilient physical infrastructure to support rapid sustainable urbanization across Latin America.",
    status: "Scaling",
    logo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80",
    sector: "Development",
    specialization: "Urban Infrastructure",
    region: "LATAM",
    capital_managed: "$2.4B",
    active_projects: 38,
    partner_since: 2015,
    is_verified: true,
  },
  {
    id: "learniox-ai-labs",
    name: "LearnioX Global AI Academy",
    slug: "learniox-ai-academy",
    tagline: "Enterprise foundational AI and full-stack software development curriculum.",
    description: "Empowering developers and enterprise engineering teams with hands-on sandboxes, cloud compiler pipelines, and multi-modal AI agent architecture.",
    status: "Active Deployment",
    logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80",
    sector: "Education",
    specialization: "Artificial Intelligence",
    region: "Global",
    capital_managed: "$540M",
    active_projects: 46,
    partner_since: 2020,
    is_verified: true,
  },
  {
    id: "aegis-cyber-defense",
    name: "Aegis Cyber Defense Alliance",
    slug: "aegis-cyber-defense",
    tagline: "Zero-trust governance and cloud container security certifications.",
    description: "Global consortium of security engineers providing offensive security labs, kernel exploitation defense courses, and compliance governance training.",
    status: "Active Deployment",
    logo_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=160&auto=format&fit=crop&q=80",
    sector: "Security",
    specialization: "Cloud & DevSecOps",
    region: "North America",
    capital_managed: "$320M",
    active_projects: 19,
    partner_since: 2019,
    is_verified: true,
  },
];

const SECTOR_FILTERS = [
  "All Sectors",
  "Investment",
  "Research",
  "Development",
  "Education",
  "Security",
  "Quantum Computing",
  "Renewable Energy",
];

export default function InstitutionDiscoveryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [activeTab, setActiveTab] = useState<'all' | 'my-orgs'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Form state for creating a new institution
  const [instName, setInstName] = useState('');
  const [instTagline, setInstTagline] = useState('');
  const [instSector, setInstSector] = useState('Education');

  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token'));

  // 1. Fetch user's own managed institutions from backend
  const { data: userInstitutionsData, isLoading: isUserInstLoading } = useQuery({
    queryKey: ['my-institutions'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>('/institutions/my');
        return res.data;
      } catch {
        return [];
      }
    },
    enabled: hasToken,
  });

  // 2. Fetch public institutions directory from backend
  const { data: publicInstitutionsData } = useQuery({
    queryKey: ['public-institutions'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>('/institutions?page=1&limit=20');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  // Create institution mutation
  const createInstMutation = useMutation({
    mutationFn: async () => {
      const toastId = toast.loading('Registering new institutional network partner...');
      try {
        const res = await apiClient.post<any, ApiResponse<any>>('/institutions', {
          name: instName,
          tagline: instTagline || undefined,
        });
        toast.success(`Institution '${instName}' registered successfully!`, { id: toastId });
        return res.data;
      } catch (err: any) {
        toast.error(err.message || 'Failed to register institution', { id: toastId });
        throw err;
      }
    },
    onSuccess: () => {
      setInstName('');
      setInstTagline('');
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['public-institutions'] });
    },
  });

  // Combine curated + real institutions
  const combinedInstitutions = useMemo<InstitutionItem[]>(() => {
    const userOwnedList = Array.isArray(userInstitutionsData)
      ? userInstitutionsData
      : (userInstitutionsData?.items || []);

    const userOwnedMap: InstitutionItem[] = userOwnedList.map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      slug: inst.slug || inst.id,
      tagline: inst.tagline || 'Managed Enterprise Learning Workspace',
      description: inst.description || inst.tagline || 'Official institutional partner organization on LearnioX.',
      status: inst.status || 'Active Deployment',
      logo_url: inst.logo_url || '',
      sector: 'Education',
      specialization: 'Custom Curriculum',
      region: 'Global',
      capital_managed: '$10M+',
      active_projects: inst.courses_count || 1,
      partner_since: new Date(inst.created_at || Date.now()).getFullYear(),
      is_verified: true,
      is_user_owned: true,
    }));

    // Filter out duplicates by slug or name
    const existingSlugs = new Set(userOwnedMap.map((i) => i.slug));
    const uniqueCurated = CURATED_DISCOVERY_INSTITUTIONS.filter(
      (c) => !existingSlugs.has(c.slug)
    );

    return [...userOwnedMap, ...uniqueCurated];
  }, [userInstitutionsData]);

  // Filter based on search query, sector, and scope tab
  const filteredInstitutions = useMemo(() => {
    return combinedInstitutions.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'my-orgs' && !item.is_user_owned) {
        return false;
      }

      // 2. Sector filter
      if (
        selectedSector !== 'All Sectors' &&
        item.sector?.toLowerCase() !== selectedSector.toLowerCase() &&
        item.specialization?.toLowerCase() !== selectedSector.toLowerCase()
      ) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSector = item.sector?.toLowerCase().includes(q);
        const matchesSpec = item.specialization?.toLowerCase().includes(q);
        const matchesRegion = item.region?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        return matchesName || matchesSector || matchesSpec || matchesRegion || matchesDesc;
      }

      return true;
    });
  }, [combinedInstitutions, activeTab, selectedSector, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredInstitutions.length / itemsPerPage));
  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstitutions.slice(start, start + itemsPerPage);
  }, [filteredInstitutions, currentPage]);

  const userOwnedCount = combinedInstitutions.filter((i) => i.is_user_owned).length;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        
        {/* Top Floating Avatar and Header Controls */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        {/* Main Discovery Container */}
        <main className="flex-1 flex flex-col items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          
          {/* Hero Header Section */}
          <div className="text-center mb-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-1">
              <Sparkles className="size-3.5" />
              <span>Global Enterprise Directory</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-sans">
              Institutional Network
            </h1>
            
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Discover and engage with our global partners driving innovation across critical sectors. Our network represents top-tier institutions committed to structural integrity and visionary advancement.
            </p>
          </div>

          {/* Action Tabs & Create Button Toolbar */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-lg border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All Network ({combinedInstitutions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('my-orgs');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'my-orgs'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Shield className="size-3 text-primary" />
                <span>My Organizations ({userOwnedCount})</span>
              </button>
            </div>

            {/* Create Institution Dialog Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 text-xs font-semibold shadow-sm cursor-pointer">
                  <Plus className="size-4" />
                  <span>Register Institution</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="size-5 text-primary" />
                    Register New Institution
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Create an institutional organization workspace to author accredited learning tracks and manage teams.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!instName.trim()) {
                      toast.error('Institution name is required');
                      return;
                    }
                    createInstMutation.mutate();
                  }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Organization / Academy Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="e.g. Acme Quantum Research Lab"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Mission / Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      value={instTagline}
                      onChange={(e) => setInstTagline(e.target.value)}
                      placeholder="e.g. Accelerating post-quantum cryptography certifications"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Primary Sector
                    </label>
                    <Select
                      value={instSector}
                      onValueChange={(val) => setInstSector(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select primary sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education">Education & Learning Academy</SelectItem>
                        <SelectItem value="Research">Applied Research & Science</SelectItem>
                        <SelectItem value="Development">Software & Cloud Development</SelectItem>
                        <SelectItem value="Security">Cybersecurity & Governance</SelectItem>
                        <SelectItem value="Investment">Venture & Technology Grants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createInstMutation.isPending}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {createInstMutation.isPending && (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      )}
                      <span>{createInstMutation.isPending ? 'Registering...' : 'Register Partner'}</span>
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Input Bar */}
          <div className="w-full mb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search institutions by name, sector, or region..."
                className="w-full bg-card border border-border/80 rounded-xl py-3.5 pl-11 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sector Filter Chips */}
          <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-8">
            {SECTOR_FILTERS.map((sector) => {
              const isSelected = selectedSector === sector;
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => {
                    setSelectedSector(sector);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer',
                    isSelected
                      ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  )}
                >
                  {sector}
                </button>
              );
            })}
          </div>

          {/* Vertical Feed of Institutional Cards */}
          <div className="w-full flex flex-col gap-6">
            {filteredInstitutions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
                <Building2 className="size-10 mx-auto text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">No institutions found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No registered partners matched your current search filters. Try adjusting your search query or reset category chips.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('All Sectors');
                    setActiveTab('all');
                  }}
                  className="text-xs"
                >
                  Reset Discovery Filters
                </Button>
              </div>
            ) : (
              paginatedInstitutions.map((inst) => {
                const isDeployment = inst.status?.toLowerCase().includes('deployment');
                const isScaling = inst.status?.toLowerCase().includes('scaling');
                const isReview = inst.status?.toLowerCase().includes('review');

                return (
                  <div
                    key={inst.id}
                    className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-primary/50 transition-all duration-300 shadow-xs hover:shadow-md group"
                  >
                    {/* Left: Organization Logo / Monogram Emblem */}
                    <div className="shrink-0 flex items-start">
                      <div className="size-20 rounded-xl overflow-hidden bg-muted/60 border border-border/80 flex items-center justify-center shadow-inner relative group-hover:border-primary/40 transition-colors">
                        {inst.logo_url ? (
                          <img
                            src={inst.logo_url}
                            alt={inst.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-primary font-extrabold text-xl">
                            <Building2 className="size-8 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Content & Metrics */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Top Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
                              {inst.name}
                            </h2>
                            {inst.is_verified && (
                              <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                                <BadgeCheck className="size-4 fill-primary/20 text-primary" />
                                <span>Verified</span>
                              </span>
                            )}
                            {inst.is_user_owned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                                My Organization
                              </span>
                            )}
                          </div>

                          {/* Status Pill with glowing indicator dot */}
                          <span
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border',
                              isDeployment && 'bg-primary/10 text-primary border-primary/20',
                              isScaling && 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                              isReview && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                              !isDeployment && !isScaling && !isReview && 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            <span
                              className={cn(
                                'size-2 rounded-full animate-pulse',
                                isDeployment && 'bg-primary',
                                isScaling && 'bg-cyan-400',
                                isReview && 'bg-amber-400',
                                !isDeployment && !isScaling && !isReview && 'bg-muted-foreground'
                              )}
                            />
                            <span>{inst.status || 'Active Deployment'}</span>
                          </span>
                        </div>

                        {/* Badges / Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {inst.sector && (
                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-primary/20">
                              {inst.sector}
                            </span>
                          )}
                          {inst.specialization && (
                            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-border">
                              {inst.specialization}
                            </span>
                          )}
                          {inst.region && (
                            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-border">
                              {inst.region}
                            </span>
                          )}
                        </div>

                        {/* Description Paragraph */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                          {inst.description}
                        </p>
                      </div>

                      {/* Bottom Metrics Bar & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/70">
                        {/* 3 Metric Columns */}
                        <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full sm:w-auto">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                              Capital Managed
                            </div>
                            <div className="text-sm sm:text-base font-bold text-foreground">
                              {inst.capital_managed || '$500M+'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                              Active Projects
                            </div>
                            <div className="text-sm sm:text-base font-bold text-foreground">
                              {inst.active_projects || 12}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                              Partner Since
                            </div>
                            <div className="text-sm sm:text-base font-bold text-foreground">
                              {inst.partner_since || 2020}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {inst.is_user_owned ? (
                            <>
                              <Link
                                href={`/institution/slug/${inst.slug}`}
                                className="flex-1 sm:flex-none border border-input text-foreground hover:bg-secondary px-4 py-2 rounded-lg text-xs font-semibold transition-colors text-center cursor-pointer"
                              >
                                Public View
                              </Link>
                              <Link
                                href={`/institution/${inst.id}`}
                                className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-semibold transition-colors text-center cursor-pointer shadow-xs"
                              >
                                Enter Workspace
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/institution/slug/${inst.slug}`}
                              className="w-full sm:w-auto border border-primary text-primary hover:bg-primary/10 px-5 py-2 rounded-lg text-xs font-semibold transition-colors text-center cursor-pointer"
                            >
                              View Profile
                            </Link>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {filteredInstitutions.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
                      'size-9 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
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
                className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

        </main>

        {/* Institutional Directory Footer */}
        <footer className="border-t border-border/60 bg-card/20 w-full mt-auto py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground font-sans">LEARNIOX INSTITUTIONAL</span>
              <span>© 2026 LearnioX Platform. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Governance</a>
              <a href="#" className="hover:text-primary transition-colors">Security</a>
            </div>
          </div>
        </footer>

      </SidebarInset>
    </SidebarProvider>
  );
}
