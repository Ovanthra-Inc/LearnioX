import Link from "next/link";
import Image from "next/image";
import { CourseCard } from "@/components/shared/course-card";
import { MOCK_COURSES, MOCK_CATEGORIES, MOCK_INSTITUTIONS, MOCK_FREE_COURSES } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, Star, Users, BookOpen, Award } from "lucide-react";

const HERO_STATS = [
  { label: "Active Learners", value: "142K+" },
  { label: "Institutions", value: "2,800+" },
  { label: "Courses", value: "18,500+" },
  { label: "Certificates Issued", value: "580K+" },
];

const TRUST_LABELS = [
  "Verified Institutions",
  "HD Video Lessons",
  "Certificate on Completion",
  "Live Classes",
  "AI Doubt Solving",
];

export default function HomePage() {
  const featuredCourses = MOCK_COURSES.slice(0, 4);
  const featuredInstitutions = MOCK_INSTITUTIONS.slice(0, 3);
  const freeCourses = MOCK_FREE_COURSES.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl">
            {/* Trust label row */}
            <div className="flex flex-wrap gap-4 mb-10">
              {TRUST_LABELS.map((label) => (
                <span key={label} className="badge border-border text-muted-foreground text-label-sm uppercase tracking-widest">
                  {label}
                </span>
              ))}
            </div>

            <h1 className="text-headline-xl font-bold text-foreground mb-6 leading-tight max-w-3xl">
              The Institutional Learning Platform for Modern India
            </h1>
            <p className="text-body-lg text-muted-foreground mb-10 max-w-2xl">
              Join thousands of students learning from India&apos;s best coaching institutions.
              Courses, live batches, memberships, and AI-powered learning — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link href="/auth/signup" className="btn-primary text-label-md uppercase tracking-widest px-8 py-4 inline-flex items-center justify-center gap-3">
                Start Learning — Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/institutions" className="btn-secondary text-label-md uppercase tracking-widest px-8 py-4 inline-flex items-center justify-center gap-3">
                Browse Institutions
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-border pt-8">
              {HERO_STATS.map((stat, idx) => (
                <div key={stat.label} className={`${idx < HERO_STATS.length - 1 ? "md:border-r md:border-border" : ""} pr-6 pt-4`}>
                  <p className="text-headline-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-label-sm text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-headline-md font-bold text-foreground">Explore Categories</h2>
              <p className="text-body-sm text-muted-foreground mt-1">
                8 disciplines, 18,500+ courses
              </p>
            </div>
            <Link href="/search" className="text-label-md uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
            {MOCK_CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`p-6 border-border flex flex-col justify-between hover:bg-surface-container transition-colors group min-h-[140px]
                  ${idx % 4 !== 3 ? "border-r" : ""}
                  ${idx < MOCK_CATEGORIES.length - 4 ? "border-b" : ""}`}
              >
                <p className="text-label-sm text-muted-foreground uppercase tracking-widest">
                  {formatNumber(cat.courseCount)} courses
                </p>
                <h3 className="text-headline-sm font-bold text-foreground group-hover:underline leading-snug">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ──────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-headline-md font-bold text-foreground">Top Courses</h2>
              <p className="text-body-sm text-muted-foreground mt-1">
                Curated by our editorial team
              </p>
            </div>
            <Link href="/search" className="text-label-md uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Browse All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border">
            {featuredCourses.map((course) => (
              <div key={course.id} className="border-r border-b border-border">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED INSTITUTIONS ─────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-headline-md font-bold text-foreground">Top Institutions</h2>
              <p className="text-body-sm text-muted-foreground mt-1">
                Verified, trusted coaching academies
              </p>
            </div>
            <Link href="/institutions" className="text-label-md uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All Institutions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
            {featuredInstitutions.map((inst, idx) => (
              <Link
                key={inst.id}
                href={`/c/${inst.slug}`}
                className={`p-6 hover:bg-surface-container transition-colors group ${idx < featuredInstitutions.length - 1 ? "md:border-r border-border" : ""}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-surface-container-high border border-border flex items-center justify-center text-headline-sm font-bold text-foreground flex-shrink-0">
                    {inst.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-0.5">
                      {inst.isVerified && "✓ Verified"}
                    </p>
                    <h3 className="text-headline-sm font-bold text-foreground leading-snug group-hover:underline">
                      {inst.name}
                    </h3>
                  </div>
                </div>
                <p className="text-body-sm text-muted-foreground line-clamp-2 mb-4">{inst.tagline}</p>
                <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-headline-sm font-bold text-foreground">{formatNumber(inst.studentCount)}</p>
                    <p className="text-label-sm text-muted-foreground uppercase">Students</p>
                  </div>
                  <div>
                    <p className="text-headline-sm font-bold text-foreground">{inst.courseCount}</p>
                    <p className="text-label-sm text-muted-foreground uppercase">Courses</p>
                  </div>
                  <div>
                    <p className="text-headline-sm font-bold text-foreground flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />{inst.rating}
                    </p>
                    <p className="text-label-sm text-muted-foreground uppercase">Rating</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE RESOURCES ────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-headline-md font-bold text-foreground">Start for Free</h2>
              <p className="text-body-sm text-muted-foreground mt-1">
                No sign-up required for these courses
              </p>
            </div>
            <Link href="/free-videos" className="text-label-md uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All Free Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-border">
            {freeCourses.length > 0 ? freeCourses.map((course) => (
              <div key={course.id} className="border-r border-b border-border">
                <CourseCard course={course} />
              </div>
            )) : MOCK_COURSES.slice(3, 6).map((course) => (
              <div key={course.id} className="border-r border-b border-border">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="max-w-[1440px] mx-auto px-6 py-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <p className="text-label-md uppercase tracking-widest text-background/60 mb-3">
              For Coaching Institutions
            </p>
            <h2 className="text-headline-lg font-bold text-background mb-2">
              Run your entire institution with AI
            </h2>
            <p className="text-body-lg text-background/70 max-w-2xl">
              One person. One dashboard. Unlimited students.
              Academy Studio gives you course builder, AI copilot, analytics, and payment management.
            </p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <Link
              href="/auth/signup"
              className="bg-background text-foreground text-label-md uppercase tracking-widest px-8 py-4 hover:opacity-90 transition-opacity inline-flex items-center gap-2 font-bold"
            >
              Start Your Academy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
