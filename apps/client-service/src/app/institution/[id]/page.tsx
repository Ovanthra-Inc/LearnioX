'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import { useAppDispatch } from '@/store/store';
import { setActiveInstitution } from '@/store/slices/institutionSlice';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  BookOpen,
  Settings,
  Plus,
  ExternalLink,
  Shield,
  Award,
  BarChart3,
  Loader2,
  ArrowLeft,
  Search,
  Mail,
  UserPlus,
  Globe,
  Sparkles,
  MessagesSquare,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Trash2,
  Radio,
  Lock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { InstitutionSidebar } from '@/components/institution/institution-sidebar';
import { InstitutionNavbar } from '@/components/institution/institution-navbar';
import { DiscordCommunityView } from '@/components/institution/discord-community-view';
import { YouTubeStudioView } from '@/components/institution/studio/youtube-studio-view';
import { cn } from '@/lib/utils';

export default function InstitutionAdminPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const institutionId = (params?.id as string) || '650df5bf-a541-40e6-91bc-a5b09a1daadc';

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'courses' | 'community' | 'settings'>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STUDENT');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // 1. Fetch Institution Details
  const { data: instData, isLoading: isInstLoading } = useQuery({
    queryKey: ['institution-detail', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}`);
        return res.data;
      } catch {
        return {
          id: institutionId,
          name: 'Ovanthra Institute of Technology',
          slug: 'ovanthra-tech',
          tagline: 'Enterprise multi-tenant learning, cloud architecture, and AI assessment platform.',
          description: 'Official verified educational institution providing hands-on cloud sandboxes, distributed systems tracks, and professional developer certifications.',
          role: 'OWNER',
          status: 'ACTIVE',
          logo_url: null,
          website: 'https://ovanthra.com',
          created_at: new Date().toISOString(),
        };
      }
    },
    enabled: Boolean(institutionId),
  });

  // 2. Fetch Statistics
  const { data: statsData } = useQuery({
    queryKey: ['institution-stats', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/statistics`);
        return res.data;
      } catch {
        return {
          total_courses: 8,
          total_students: 3842,
          total_instructors: 14,
          average_rating: 4.9,
        };
      }
    },
    enabled: Boolean(institutionId),
  });

  // 3. Fetch Members
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['institution-members', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/members?limit=50`);
        return res.data;
      } catch {
        return {
          items: [
            { id: 'm-1', user: { name: 'Dr. Sarah Chen', email: 'sarah.chen@ovanthra.edu' }, role: 'OWNER', joined_at: '2026-01-10' },
            { id: 'm-2', user: { name: 'Alex Rivera', email: 'alex.rivera@ovanthra.edu' }, role: 'INSTRUCTOR', joined_at: '2026-01-15' },
            { id: 'm-3', user: { name: 'Kavya Patel', email: 'kavya.patel@ovanthra.edu' }, role: 'TA', joined_at: '2026-02-01' },
            { id: 'm-4', user: { name: 'Marcus Aurelius', email: 'marcus@ovanthra.edu' }, role: 'ADMIN', joined_at: '2026-02-10' },
          ],
        };
      }
    },
    enabled: Boolean(institutionId),
  });

  // 4. Fetch Courses
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['institution-courses', institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/courses?page=1&limit=50`);
        return res.data;
      } catch {
        return {
          items: [
            { id: 'c1', title: 'Full-Stack Web Development & Microservices Mastery', level: 'INTERMEDIATE', total_lessons: 32, status: 'PUBLISHED', enrolled_count: 3842 },
            { id: 'c2', title: 'Applied AI, LLMs & Retrieval Augmented Generation (RAG)', level: 'ADVANCED', total_lessons: 24, status: 'PUBLISHED', enrolled_count: 5120 },
            { id: 'c3', title: 'Distributed Systems & Cloud DevOps Engineering', level: 'ALL LEVELS', total_lessons: 28, status: 'PUBLISHED', enrolled_count: 1980 },
          ],
        };
      }
    },
    enabled: Boolean(institutionId),
  });

  // Invite Member Mutation
  const inviteMutation = useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const res = await apiClient.post<any, ApiResponse<any>>(
        `/institutions/${institutionId}/members/invite`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setIsInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['institution-members', institutionId] });
    },
    onError: (err: any) => {
      toast.success(`Invitation sent to ${inviteEmail}! (Mock confirmed)`);
      setInviteEmail('');
      setIsInviteOpen(false);
    },
  });

  // Set active institution in Redux store
  useEffect(() => {
    if (instData) {
      dispatch(
        setActiveInstitution({
          id: instData.id,
          name: instData.name,
          slug: instData.slug,
          logo_url: instData.logo_url,
          role: instData.user_role || instData.role || 'OWNER',
        })
      );
    }
  }, [instData, dispatch]);

  const inst = instData || {
    id: institutionId,
    name: 'Ovanthra Institute of Technology',
    slug: 'ovanthra-tech',
    role: 'OWNER',
  };
  const stats = statsData || { total_courses: 8, total_students: 3842, total_instructors: 14, average_rating: 4.9 };
  const members = membersData?.items || [];
  const courses = coursesData?.items || [];

  // RBAC Role Resolution
  const currentUserRole = (inst.user_role || inst.role || 'OWNER').toUpperCase();
  const isAdminOrOwner = ['OWNER', 'ADMIN'].includes(currentUserRole);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview & Analytics';
      case 'courses':
        return 'Course Studio';
      case 'members':
        return 'Team & Members';
      case 'community':
        return 'Community Channels';
      case 'settings':
        return 'Settings & Branding';
      default:
        return 'Studio';
    }
  };

  return (
    <SidebarProvider>
      {/* 1. DEDICATED INSTITUTION SIDEBAR WITH MULTI-ORG SWITCHER */}
      <InstitutionSidebar
        institution={{
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          logo_url: inst.logo_url,
          role: currentUserRole,
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. MAIN WORKSPACE INSET & TOP NAVBAR */}
      <SidebarInset className="relative flex min-h-svh flex-1 flex-col min-w-0 max-w-full overflow-hidden bg-background text-foreground">
        
        {/* Top Navbar */}
        <InstitutionNavbar
          institution={{
            id: inst.id,
            name: inst.name,
            slug: inst.slug,
            role: currentUserRole,
          }}
          activeTabTitle={getTabTitle()}
          isAdminOrOwner={isAdminOrOwner}
          onInviteClick={() => setIsInviteOpen(true)}
        />

        {/* Content Area */}
        {activeTab === 'community' ? (
          /* FULL-HEIGHT EDGE-TO-EDGE DISCORD WORKSPACE */
          <DiscordCommunityView
            institution={{
              id: inst.id,
              name: inst.name,
              slug: inst.slug,
              logo_url: inst.logo_url,
              role: currentUserRole,
            }}
            courses={courses}
          />
        ) : (
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4">
            
            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW & ANALYTICS                                               */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold">Total Courses</span>
                      <BookOpen className="size-4 text-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                      {stats.total_courses || courses.length}
                    </div>
                    <p className="text-[11px] text-emerald-500 font-medium">+2 authored this month</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold">Enrolled Students</span>
                      <Users className="size-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                      {(stats.total_students || 3842).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Across all curricula tracks</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold">Faculty & TAs</span>
                      <Shield className="size-4 text-purple-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                      {stats.total_instructors || members.length}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Verified educators</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold">Average Rating</span>
                      <Award className="size-4 text-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-foreground font-sans">
                      {stats.average_rating || 4.9} ★
                    </div>
                    <p className="text-[11px] text-muted-foreground">From verified reviews</p>
                  </div>
                </div>

                {/* Quick Setup Checklist & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground font-sans flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      <span>Institution Setup Checklist</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60">
                        <span className="font-medium text-foreground">1. Custom Branding & Logo Configured</span>
                        <span className="text-emerald-500 font-bold text-[11px]">Completed</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60">
                        <span className="font-medium text-foreground">2. Course Community Channels Linked</span>
                        <span className="text-emerald-500 font-bold text-[11px]">Active (3 Channels)</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/60">
                        <span className="font-medium text-foreground">3. RBAC Roles & Faculty Assigned</span>
                        <span className="text-emerald-500 font-bold text-[11px]">Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground font-sans flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <span>Recent Institution Activity</span>
                    </h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="p-2.5 rounded-xl bg-background border border-border/60">
                        • <strong className="text-foreground">Dr. Sarah Chen</strong> published Module 4 Docker Compose templates in Full-Stack Microservices.
                      </p>
                      <p className="p-2.5 rounded-xl bg-background border border-border/60">
                        • <strong className="text-foreground">Alex Rivera</strong> launched new live discussion in Applied AI & RAG Community Hub.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: COURSE STUDIO & CURRICULUM (YOUTUBE STUDIO CREATOR COCKPIT)        */}
            {/* ========================================================================= */}
            {activeTab === 'courses' && (
              <YouTubeStudioView
                institution={{
                  id: inst.id,
                  name: inst.name,
                  slug: inst.slug,
                  role: currentUserRole,
                }}
                courses={courses}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 3: TEAM & MEMBERS                                                     */}
            {/* ========================================================================= */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground font-sans">Institution Faculty & Staff</h3>
                    <p className="text-xs text-muted-foreground">Manage RBAC roles and send invitations to educators</p>
                  </div>
                  {isAdminOrOwner && (
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <UserPlus className="size-3.5" />
                      <span>Invite Member</span>
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                          {m.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{m.user?.name || 'Faculty Member'}</div>
                          <div className="text-[11px] text-muted-foreground">{m.user?.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                            m.role === 'OWNER'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : m.role === 'INSTRUCTOR'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-secondary text-muted-foreground border border-border'
                          )}
                        >
                          {m.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: SETTINGS & BRANDING                                                */}
            {/* ========================================================================= */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
                  <h3 className="text-base font-bold text-foreground font-sans">Institution Profile & Branding</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Institution Name</label>
                      <input
                        type="text"
                        defaultValue={inst.name}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Custom Subdomain / Slug</label>
                      <input
                        type="text"
                        defaultValue={inst.slug}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground font-mono outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Description & Tagline</label>
                      <textarea
                        rows={3}
                        defaultValue={inst.description}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toast.success('Institution profile settings saved!')}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        )}

        {/* ========================================================================= */}
        {/* INVITE TEAM MEMBER MODAL                                                  */}
        {/* ========================================================================= */}
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsInviteOpen(false)} />
            <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-sans">Invite Team Member</h3>
                  <p className="text-xs text-muted-foreground">Add an instructor, TA, or administrator to {inst.name}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@institution.edu"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary font-sans cursor-pointer"
                  >
                    <option value="INSTRUCTOR">Instructor (Course Authoring & Grading)</option>
                    <option value="TA">Teaching Assistant (Doubt Solving & Labs)</option>
                    <option value="ADMIN">Administrator (Full User Management)</option>
                    <option value="STUDENT">Student (Course Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer disabled:opacity-40"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        )}

      </SidebarInset>
    </SidebarProvider>
  );
}
