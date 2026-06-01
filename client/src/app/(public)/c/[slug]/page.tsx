"use client";

import { use, useState } from "react";
import Link from "next/link";
import { getInstitutionBySlug, MOCK_MEMBERSHIPS } from "@/lib/mock-data/institutions";
import { getCoursesByInstitution } from "@/lib/mock-data/courses";
import { CourseCard } from "@/components/shared/course-card";
import { Star, ShieldCheck, Users, BookOpen, UserCheck, MessageSquare, Megaphone, Check } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface InstitutionLandingPageProps {
  params: Promise<{ slug: string }>;
}

export default function InstitutionLandingPage({ params }: InstitutionLandingPageProps) {
  const { slug } = use(params);
  const inst = getInstitutionBySlug(slug) || getInstitutionBySlug("techglobal")!;
  const [activeTab, setActiveTab] = useState<"home" | "courses" | "memberships" | "teachers" | "community" | "reviews">("home");
  const [isFollowing, setIsFollowing] = useState(false);

  // Courses
  const instCourses = getCoursesByInstitution(inst.id);

  // Memberships
  const instMemberships = MOCK_MEMBERSHIPS.filter((m) => m.institutionId === inst.id);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 font-sans space-y-8">
      {/* Institution Banner / Header */}
      <div className="border border-border bg-card">
        {/* Banner Area */}
        <div className="h-48 md:h-64 bg-zinc-900 border-b border-border flex items-end justify-between p-6 relative">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80')" }} />
          
          {/* Logo & Basic details */}
          <div className="relative flex flex-col md:flex-row gap-5 items-start md:items-end z-10">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-foreground text-background flex items-center justify-center text-headline-md md:text-headline-lg font-bold border border-border flex-shrink-0">
              {inst.name.charAt(0)}
            </div>
            <div className="space-y-1.5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-headline-md font-bold leading-tight">{inst.name}</h1>
                {inst.isVerified && <ShieldCheck className="w-5 h-5 text-white fill-zinc-900 flex-shrink-0" />}
              </div>
              <p className="text-body-sm text-zinc-300 max-w-xl">{inst.tagline}</p>
            </div>
          </div>

          {/* Follow Button */}
          <div className="relative z-10 hidden md:block">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-6 py-3 text-label-sm uppercase tracking-wider font-bold transition-all ${
                isFollowing 
                  ? "bg-background text-foreground border border-foreground" 
                  : "bg-background text-foreground hover:opacity-90"
              }`}
            >
              {isFollowing ? "✓ Following" : "Follow Channel"}
            </button>
          </div>
        </div>

        {/* Channels Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-border/60 bg-surface divide-x divide-border">
          <div className="p-4 text-center">
            <p className="text-body-lg font-bold text-foreground">{formatNumber(inst.studentCount)}</p>
            <p className="text-label-sm text-muted-foreground uppercase">Active Students</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-body-lg font-bold text-foreground">{inst.courseCount}</p>
            <p className="text-label-sm text-muted-foreground uppercase">Programs</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-body-lg font-bold text-foreground flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" /> {inst.rating}
            </p>
            <p className="text-label-sm text-muted-foreground uppercase">Average Rating</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-body-lg font-bold text-foreground">{formatNumber(inst.followersCount)}</p>
            <p className="text-label-sm text-muted-foreground uppercase">Followers</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border bg-card overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: "home", label: "Home", icon: <ShieldCheck className="w-4 h-4" /> },
          { id: "courses", label: `Programs (${instCourses.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: "memberships", label: `Pass Plans (${instMemberships.length})`, icon: <Users className="w-4 h-4" /> },
          { id: "teachers", label: "Instructors", icon: <UserCheck className="w-4 h-4" /> },
          { id: "community", label: "Community Feed", icon: <Megaphone className="w-4 h-4" /> },
          { id: "reviews", label: "Student Reviews", icon: <MessageSquare className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-4 text-label-sm uppercase tracking-widest font-bold border-r border-border transition-colors inline-flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-surface-container text-foreground border-b-2 border-b-foreground"
                : "text-muted-foreground hover:bg-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content views */}
      <div className="space-y-8">
        
        {/* Tab: Home */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h3 className="text-headline-sm font-bold uppercase tracking-tight">About Academy</h3>
                <p className="text-body-md text-muted-foreground leading-relaxed">
                  {inst.description}
                </p>
              </div>

              {inst.achievements.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {inst.achievements.map((ach, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center p-3 border border-border bg-card text-body-sm text-foreground font-semibold">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-border bg-card p-5 space-y-4">
                <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">Contact</h4>
                <div className="text-body-sm space-y-2 text-foreground">
                  <p><strong>Email:</strong> {inst.contactEmail}</p>
                  <p><strong>Website:</strong> <a href={inst.socialLinks?.website} target="_blank" rel="noopener noreferrer" className="underline">{inst.socialLinks?.website}</a></p>
                  <p><strong>Founded:</strong> {inst.foundedYear}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Courses */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4 flex justify-between items-center">
              <h3 className="text-headline-sm font-bold uppercase tracking-tight">Available Programs</h3>
              <span className="text-xs text-muted-foreground uppercase">{instCourses.length} active programs</span>
            </div>
            {instCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border">
                {instCourses.map((course) => (
                  <div key={course.id} className="border-r border-b border-border">
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border p-16 text-center text-muted-foreground">
                No programs published yet. Check back soon.
              </div>
            )}
          </div>
        )}

        {/* Tab: Memberships */}
        {activeTab === "memberships" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-headline-sm font-bold uppercase tracking-tight">Academy Pass Plans</h3>
            </div>
            {instMemberships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {instMemberships.map((plan) => (
                  <div key={plan.id} className={`p-6 border border-border bg-card flex flex-col justify-between min-h-[380px] ${plan.isPopular ? "border-foreground" : ""}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-label-sm text-muted-foreground uppercase tracking-widest">Subscription Plan</span>
                        {plan.isPopular && <span className="text-[9px] bg-foreground text-background font-bold px-2 py-0.5 uppercase tracking-wider">Popular</span>}
                      </div>
                      <h4 className="text-headline-sm font-bold text-foreground">{plan.name}</h4>
                      <p className="text-body-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                      <div className="pt-2 flex items-baseline gap-1">
                        <span className="text-headline-lg font-bold text-foreground">{formatCurrency(plan.price)}</span>
                        <span className="text-xs text-muted-foreground">/{plan.billingCycle}</span>
                      </div>
                      <ul className="space-y-2 pt-4 border-t border-border/60">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/checkout/${instCourses[0]?.id || "course-1"}`}
                      className="mt-6 w-full text-center py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
                    >
                      Subscribe Plan
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border p-16 text-center text-muted-foreground">
                No subscription plans configured for this institution yet.
              </div>
            )}
          </div>
        )}

        {/* Tab: Teachers */}
        {activeTab === "teachers" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-headline-sm font-bold uppercase tracking-tight">Our Faculty</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border bg-card p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-surface-container border border-border flex items-center justify-center font-bold text-sm uppercase text-foreground flex-shrink-0">
                  RI
                </div>
                <div>
                  <h4 className="text-body-md font-bold text-foreground">{inst.ownerName}</h4>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Academy Founder & Director</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Senior director coordinating the technology education pipelines. 15+ years education research.
                  </p>
                </div>
              </div>
              {instCourses[0]?.instructors.map((ins) => (
                <div key={ins.id} className="border border-border bg-card p-6 flex gap-4 items-start">
                  <div className="w-12 h-12 bg-surface-container border border-border flex items-center justify-center font-bold text-sm uppercase text-foreground flex-shrink-0">
                    {ins.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-body-md font-bold text-foreground">{ins.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase font-medium">{ins.title}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Lead faculty instructor organizing graded quizzes, lesson outline builds, and doubt solver reviews.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Community */}
        {activeTab === "community" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-headline-sm font-bold uppercase tracking-tight">Announcements Feed</h3>
            </div>
            <div className="space-y-4 max-w-2xl">
              <div className="border border-border p-5 bg-card space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-foreground text-background px-2 py-0.5 uppercase font-bold font-mono tracking-wider">Announcement</span>
                  <span className="text-xs text-muted-foreground font-mono">1 day ago</span>
                </div>
                <h4 className="text-body-md font-bold text-foreground">JEE/NEET Mock Practice Papers Released</h4>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  Students under the Basic and Pro packages can now find the mock papers directly inside their Tests dashboard. Please complete them before next Friday.
                </p>
              </div>
              <div className="border border-border p-5 bg-card space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-foreground text-background px-2 py-0.5 uppercase font-bold font-mono tracking-wider">Announcement</span>
                  <span className="text-xs text-muted-foreground font-mono">3 days ago</span>
                </div>
                <h4 className="text-body-md font-bold text-foreground">Python Advanced NumPy Workshops Live</h4>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  Our weekend MLOps and NumPy workspace session goes live tomorrow morning. Check the Live Classes module for timing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Reviews */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-headline-sm font-bold uppercase tracking-tight">Academy Reviews</h3>
            </div>
            <div className="space-y-4 max-w-2xl">
              <div className="border border-border p-5 bg-card space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Vikram R.</span>
                  <span className="text-muted-foreground font-mono">2 weeks ago</span>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />)}
                </div>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  Excellent faculty support. The doubt solving team resolved my NumPy questions within 30 minutes! Highly recommended program.
                </p>
              </div>
              <div className="border border-border p-5 bg-card space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Meera Joshi</span>
                  <span className="text-muted-foreground font-mono">1 month ago</span>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />)}
                </div>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  Great curriculum pacing. The video streaming has very low latency and Storybook layout preview tasks are very practical.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
