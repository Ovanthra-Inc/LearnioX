'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';
import {
  Building2,
  Users,
  Plus,
  Shield,
  Layers,
  Settings,
  UserPlus,
  BookPlus,
  Loader2,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { NavUser } from '@/components/nav-user';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export default function InstitutionPage() {
  const queryClient = useQueryClient();
  const [instName, setInstName] = useState('');
  const [instTagline, setInstTagline] = useState('');
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token'));

  // Fetch institutions owned by user
  const { data: institutionsData, isLoading } = useQuery({
    queryKey: ['my-institutions'],
    queryFn: async () => {
      const res = await apiClient.get<any, ApiResponse<any>>(
        '/institutions/my'
      );
      return res.data;
    },
    enabled: hasToken,
  });

  // Create institution mutation
  const createInstMutation = useMutation({
    mutationFn: async () => {
      const toastId = toast.loading('Creating institution organization...');
      try {
        const res = await apiClient.post<any, ApiResponse<any>>('/institutions', {
          name: instName,
          tagline: instTagline || undefined,
        });
        toast.success(`Institution '${instName}' created successfully!`, { id: toastId });
        return res.data;
      } catch (err: any) {
        toast.error(err.message || 'Failed to create institution', { id: toastId });
        throw err;
      }
    },
    onSuccess: () => {
      setInstName('');
      setInstTagline('');
      queryClient.invalidateQueries({ queryKey: ['my-institutions'] });
    },
  });

  const institutions = Array.isArray(institutionsData)
    ? institutionsData
    : (institutionsData?.items || []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        {/* Top-Right Floating Avatar */}
        <div className="absolute top-4 right-4 sm:right-6 z-30 flex items-center gap-3">
          <NavUser />
        </div>

        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Institution & Team Management
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Manage multi-tenant organizations, team roles, and author institutional courses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Create Institution Form */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 h-fit">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Create New Institution</h2>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!instName.trim()) {
                    toast.error('Institution name is required');
                    return;
                  }
                  createInstMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Institution / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="e.g. Acme AI Academy"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    value={instTagline}
                    onChange={(e) => setInstTagline(e.target.value)}
                    placeholder="e.g. Enterprise Cloud & ML Certifications"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createInstMutation.isPending}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createInstMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>
                    {createInstMutation.isPending ? 'Creating...' : 'Register Institution'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right: Existing Organizations */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-foreground flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                My Managed Organizations ({institutions.length})
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
                  <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
                </div>
              ) : institutions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    You do not own any active institutions yet. Register your first organization on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {institutions.map((inst: any) => (
                    <div
                      key={inst.id}
                      className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-foreground font-sans">
                            {inst.name}
                          </h3>
                          {inst.tagline && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inst.tagline}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                          {inst.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="text-[11px] font-mono">Slug: {inst.slug}</span>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/institution/slug/${inst.slug}`}
                            target="_blank"
                            className="inline-flex items-center space-x-1 rounded bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent cursor-pointer transition-colors"
                          >
                            <Globe className="h-3 w-3 mr-1 text-primary" />
                            Public View
                          </Link>

                          <Link
                            href={`/institution/${inst.id}`}
                            className="inline-flex items-center space-x-1 rounded bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold hover:bg-primary/90 cursor-pointer transition-colors shadow-sm"
                          >
                            <span>Enter Workspace</span>
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
