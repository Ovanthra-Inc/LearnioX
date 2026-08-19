'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/store';
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
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function InstitutionAdminPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const institutionId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'courses' | 'settings'>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STUDENT');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // 1. Fetch Institution Details
  const { data: instData, isLoading: isInstLoading } = useQuery({
    queryKey: ['institution-detail', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}`);
      return res.data;
    },
    enabled: Boolean(institutionId),
  });

  // 2. Fetch Statistics
  const { data: statsData } = useQuery({
    queryKey: ['institution-stats', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/statistics`);
      return res.data;
    },
    enabled: Boolean(institutionId),
  });

  // 3. Fetch Members
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['institution-members', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}/members?limit=50`);
      return res.data;
    },
    enabled: Boolean(institutionId) && activeTab === 'members',
  });

  // 4. Fetch Courses
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['institution-courses', institutionId],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(`/courses?page=1&limit=50`);
      return res.data;
    },
    enabled: Boolean(institutionId) && activeTab === 'courses',
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
      toast.error(err.message || 'Failed to send invitation');
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
        })
      );
    }
  }, [instData, dispatch]);

  if (isInstLoading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading workspace...</span>
      </div>
    );
  }

  const inst = instData || {};
  const stats = statsData || { total_courses: 0, total_students: 0, total_instructors: 0, average_rating: 0 };
  const members = membersData?.items || [];
  const courses = coursesData?.items || [];

  // RBAC Role Resolution
  const currentUserRole = (inst.user_role || inst.role || 'OWNER').toUpperCase();
  const isAdminOrOwner = ['OWNER', 'ADMIN'].includes(currentUserRole);
  const isInstructorOrHigher = ['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(currentUserRole);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/institution"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>My Organizations</span>
          </Link>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-xs font-bold text-foreground">{inst.name}</span>
        </div>

        {/* Public View Trigger */}
        <Link
          href={`/institution/slug/${inst.slug}`}
          target="_blank"
          className="inline-flex items-center space-x-1.5 rounded-md border border-input bg-card hover:bg-accent px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span>Switch to Public Student View</span>
          <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
        </Link>
      </div>

      {/* Organization Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-2xl border border-primary/20 shrink-0">
            {inst.logo_url ? (
              <img src={inst.logo_url} alt={inst.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">{inst.name}</h1>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                ACTIVE WORKSPACE
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                ROLE: {currentUserRole}
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl line-clamp-2">
              {inst.tagline || inst.description || 'Enterprise institution learning & developer track authoring workspace.'}
            </p>
            <div className="pt-1 flex items-center space-x-3 text-[11px] text-muted-foreground">
              <span>Slug: <code className="text-primary font-mono font-semibold">{inst.slug}</code></span>
              <span>•</span>
              <span>ID: <code className="font-mono text-muted-foreground">{inst.id?.slice(0, 8)}...</code></span>
            </div>
          </div>
        </div>

        {isAdminOrOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Team Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="h-4 w-4" />
            <span>Overview & Stats</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'members'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Users className="h-4 w-4" />
            <span>Team & Members</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <BookOpen className="h-4 w-4" />
            <span>Courses & Tracks</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Settings className="h-4 w-4" />
            <span>Settings & Branding</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Total Courses</span>
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{stats.total_courses || courses.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">Active tracks published</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Enrolled Students</span>
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{stats.total_students || 0}</p>
              <p className="text-[10px] text-muted-foreground">Active platform learners</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Instructors</span>
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{stats.total_instructors || 1}</p>
              <p className="text-[10px] text-muted-foreground">Content authors</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Average Rating</span>
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{stats.average_rating ? stats.average_rating.toFixed(1) : '4.9'}</p>
              <p className="text-[10px] text-muted-foreground">Student feedback score</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">Organization Administration Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('courses')}
                className="flex items-center space-x-3 rounded-lg border border-border bg-background p-4 hover:border-primary/50 transition-colors text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Create Course Track</h4>
                  <p className="text-[10px] text-muted-foreground">Publish lessons & modules</p>
                </div>
              </button>

              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center space-x-3 rounded-lg border border-border bg-background p-4 hover:border-primary/50 transition-colors text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Invite Instructor</h4>
                  <p className="text-[10px] text-muted-foreground">Grant authoring access</p>
                </div>
              </button>

              <Link
                href={`/institution/slug/${inst.slug}`}
                target="_blank"
                className="flex items-center space-x-3 rounded-lg border border-border bg-background p-4 hover:border-primary/50 transition-colors text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Preview Landing Page</h4>
                  <p className="text-[10px] text-muted-foreground">Public learner page view</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Team Members & Access Control</h3>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </button>
          </div>

          {isMembersLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <Users className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-xs font-medium text-muted-foreground">No active team members listed yet.</p>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="inline-flex items-center space-x-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground cursor-pointer"
              >
                <span>Invite First Member</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {members.map((m: any) => (
                <div key={m.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {m.user?.name ? m.user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{m.user?.name || m.user?.email || 'Team Member'}</p>
                      <p className="text-[10px] text-muted-foreground">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {m.role || 'MEMBER'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Joined {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Institution Course Catalog</h3>
            <Link
              href="/courses"
              className="inline-flex items-center space-x-1.5 rounded-md bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Course Track</span>
            </Link>
          </div>

          {isCoursesLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading courses...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 6).map((c: any) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {c.level || 'BEGINNER'}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.subtitle || c.description || 'Course track'}</p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{c.price > 0 ? `₹${c.price}` : 'FREE'}</span>
                    <Link
                      href={`/courses/${c.id}`}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Manage Modules →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-foreground">Organization Settings & Visibility</h3>
          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Organization Name</label>
              <input
                type="text"
                disabled
                value={inst.name || ''}
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-foreground font-medium"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Public URL Slug</label>
              <input
                type="text"
                disabled
                value={inst.slug || ''}
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Tagline</label>
              <input
                type="text"
                disabled
                value={inst.tagline || ''}
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Invite Team Member</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@institution.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Role</label>
                <Select
                  value={inviteRole}
                  onValueChange={(val) => setInviteRole(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="rounded-md border border-input bg-background px-4 py-2 text-xs font-semibold text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="inline-flex items-center space-x-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
              >
                {inviteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Send Invite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
