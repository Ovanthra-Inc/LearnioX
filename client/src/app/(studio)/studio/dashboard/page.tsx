"use client";

import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { BadgeStatus } from "@/components/shared/ui-elements";
import { RevenueChart } from "@/components/studio/revenue-chart";
import {
  MOCK_STUDIO_ANALYTICS,
  MOCK_COURSE_ANALYTICS,
  MOCK_REVENUE_DATA,
  MOCK_UPCOMING_LIVE_CLASSES,
  MOCK_ACTIVITY_LOGS,
  MOCK_STUDIO_NOTIFICATIONS,
} from "@/lib/mock-data/studio";
import { MOCK_DOUBTS } from "@/lib/mock-data/learner";
import { formatCurrency, formatDate, formatRelativeTime, formatNumber } from "@/lib/utils";
import { ArrowRight, Plus, Bot, HelpCircle, Users, BookOpen, Radio } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

function getDashboardConfiguration(type: string | undefined) {
  switch (type) {
    case "college_university":
      return {
        audienceLabel: "Enrolled Undergraduates",
        audienceValue: 22100,
        audienceTrend: 6,
        audienceTrendLabel: "vs last sem",
        cohortLabel: "Syllabus Modules",
        cohortValue: 12,
        extraLabel: "Avg. Semester GPA",
        extraValue: "3.65 GPA",
        extraSub: "Passing rate: 98%",
        featureTitle: "Academic Operations Hub",
        features: [
          { name: "Manage Admissions", desc: "Review undergrad enrollment applications and status lists.", action: "View Applications" },
          { name: "Academic Timetable", desc: "Create lecture calendars, lab shifts, and exam halls schedules.", action: "Plan Schedule" },
          { name: "Course Credits Matrix", desc: "Define structural credit weights per syllabus stream.", action: "Edit Credits" }
        ]
      };
    case "corporate_training":
      return {
        audienceLabel: "Active Employees",
        audienceValue: 18400,
        audienceTrend: 12,
        audienceTrendLabel: "onboarding",
        cohortLabel: "Skill Modules",
        cohortValue: 9,
        extraLabel: "Compliance Ratio",
        extraValue: "94.2%",
        extraSub: "Audit deadline: 30 days",
        featureTitle: "Corporate Alignment Workspace",
        features: [
          { name: "Compliance Tracks", desc: "Automate mandatory security, safety, and governance course logs.", action: "Audit Compliance" },
          { name: "Skill Gap Matrix", desc: "Track completion rates and skill sets mappings across divisions.", action: "Analyze Gaps" },
          { name: "HR System Integration", desc: "Sync active training profiles with Workday & SAP SuccessFactors.", action: "Manage Sync" }
        ]
      };
    case "k12_school":
      return {
        audienceLabel: "Enrolled Pupils",
        audienceValue: 8900,
        audienceTrend: 4,
        audienceTrendLabel: "this term",
        cohortLabel: "Grade Levels",
        cohortValue: 6,
        extraLabel: "Linked Parent Portals",
        extraValue: "7,420 Linked",
        extraSub: "Parent engagement: 88%",
        featureTitle: "Student Engagement & Safety Portal",
        features: [
          { name: "Parent Dashboard Link", desc: "Configure permissions for homework progress reports and conferences.", action: "Parent Settings" },
          { name: "Gamified Star Rewards", desc: "Track pupils achievement points, badges, and class leaderboards.", action: "Customize Rewards" },
          { name: "Cyber-Safety Filters", desc: "Toggle safe-chat restrictions, word blocks, and student reporting.", action: "Safety Filters" }
        ]
      };
    case "workshop_seminar":
      return {
        audienceLabel: "Registered Attendees",
        audienceValue: 1250,
        audienceTrend: undefined,
        audienceTrendLabel: "Capacity: 85%",
        cohortLabel: "Event Streams",
        cohortValue: 4,
        extraLabel: "Tickets Revenue",
        extraValue: "$45,200",
        extraSub: "VIP/Early Bird ratio: 40%",
        featureTitle: "Virtual Event Coordination Hub",
        features: [
          { name: "Ticketing & Tiers", desc: "Manage Early Bird, VIP, and General barcode registrations and check-ins.", action: "Ticketing Tiers" },
          { name: "Live Panels & Breakouts", desc: "Configure small interactive workspace circles and parallel streams.", action: "Configure Rooms" },
          { name: "Audience Q&A Pool", desc: "Moderate upvoted attendee questions for display on live streams.", action: "Open Q&A" }
        ]
      };
    case "organization":
      return {
        audienceLabel: "Beneficiaries",
        audienceValue: 12800,
        audienceTrend: undefined,
        audienceTrendLabel: "6 languages active",
        cohortLabel: "Programs Active",
        cohortValue: 8,
        extraLabel: "Grant Funding Allocated",
        extraValue: "$250,000",
        extraSub: "Fund utilization: 72%",
        featureTitle: "NGO & Institutional Compliance Hub",
        features: [
          { name: "Donor Report Compiler", desc: "Export training outcomes, graduation stats, and grant metrics.", action: "Generate Report" },
          { name: "Regulatory Auditing Logs", desc: "Maintain secure, unalterable logs of student registry for audits.", action: "Audit Ledger" },
          { name: "Regional Localizations", desc: "Translate core platform resources and interface to local languages.", action: "Edit Languages" }
        ]
      };
    case "edtech_startup":
      return {
        audienceLabel: "Subscribed Learners",
        audienceValue: 45200,
        audienceTrend: 18,
        audienceTrendLabel: "active growth",
        cohortLabel: "Premium Programs",
        cohortValue: 18,
        extraLabel: "Marketplace Sales",
        extraValue: "$184,500",
        extraSub: "Affiliate contribution: 12%",
        featureTitle: "Startup Monetization & Growth Engine",
        features: [
          { name: "Marketplace Commissions", desc: "Setup revenue share plans, stripe payouts, and installment cycles.", action: "Configure Fees" },
          { name: "Affiliate Referral Portal", desc: "Reward students with custom discount links and track lead sources.", action: "Manage Affiliates" },
          { name: "Modular Cohorts Lock", desc: "Force linear curriculum learning paths with quiz lock mechanisms.", action: "Edit Path Locks" }
        ]
      };
    case "general":
    default:
      return {
        audienceLabel: "Active Learners",
        audienceValue: 45200,
        audienceTrend: 14,
        audienceTrendLabel: "active growth",
        cohortLabel: "Total Courses",
        cohortValue: 18,
        extraLabel: "Pending Doubts",
        extraValue: "142 Active",
        extraSub: "Response SLA: < 2 hours",
        featureTitle: "Academy Operations Hub",
        features: [
          { name: "Doubt Auto-Responder", desc: "Configure AI RAG transcript indexing guidelines for doubts.", action: "Doubt Settings" },
          { name: "Analytics Ledger", desc: "Inspect student completion durations and overall course rating feeds.", action: "View Reports" },
          { name: "Global Settings", desc: "Manage subdomain channels, profile icons, and team permissions.", action: "Settings Panel" }
        ]
      };
  }
}

export default function StudioDashboardPage() {
  const institution = useAppSelector((s) => s.institution.selectedInstitution);
  const instType = institution?.institutionType || "general";
  const config = getDashboardConfiguration(instType);

  const analytics = MOCK_STUDIO_ANALYTICS;
  const pendingDoubts = MOCK_DOUBTS.filter((d) => d.status === "pending");
  const upcomingClasses = MOCK_UPCOMING_LIVE_CLASSES.slice(0, 3);
  const recentActivity = MOCK_ACTIVITY_LOGS.slice(0, 5);
  const notifications = MOCK_STUDIO_NOTIFICATIONS.filter((n) => !n.isRead);

  return (
    <div className="space-y-8">
      {/* ── Page Title ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Academy Studio</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Design Institute — Today&apos;s overview
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/studio/ai-copilot"
            className="flex items-center gap-2 px-4 py-2 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider"
          >
            <Bot className="w-4 h-4" />
            AI Copilot
          </Link>
          <Link
            href="/studio/courses"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity font-bold"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-border">
        <div className="border-r border-border">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(analytics.totalRevenue)}
            trend={analytics.revenueChange}
            trendLabel="vs last month"
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label={config.audienceLabel}
            value={formatNumber(config.audienceValue)}
            trend={config.audienceTrend}
            trendLabel={config.audienceTrendLabel}
            inverted
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label={config.cohortLabel}
            value={formatNumber(config.cohortValue)}
            trendLabel="Active"
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label="Watch Hours"
            value={formatNumber(analytics.watchTimeHours)}
            suffix="h"
            trend={analytics.watchTimeChange}
          />
        </div>
        <div className="border-r border-border">
          <StatCard
            label={config.extraLabel}
            value={config.extraValue}
            trendLabel={config.extraSub}
          />
        </div>
        <div>
          <StatCard
            label="Completion Rate"
            value={`${analytics.completionRate}%`}
            trend={analytics.completionRateChange}
          />
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 border-r border-border p-6 min-w-0">
          <SectionHeader title="Revenue Overview" subtitle="Last 7 months" />
          <RevenueChart data={MOCK_REVENUE_DATA} />
        </div>

        {/* Pending Doubts */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-headline-sm font-bold text-foreground">Pending Doubts</h3>
              <p className="text-label-sm text-muted-foreground uppercase">{pendingDoubts.length} unresolved</p>
            </div>
            <Link
              href="/studio/doubts"
              className="text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0 border border-border">
            {pendingDoubts.slice(0, 4).map((doubt) => (
              <div key={doubt.id} className="p-4 border-b last:border-b-0 border-border hover:bg-surface-container transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-body-sm font-semibold text-foreground line-clamp-1">{doubt.userName}</p>
                  <span className="text-label-sm text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(doubt.createdAt)}
                  </span>
                </div>
                <p className="text-label-sm text-muted-foreground line-clamp-2">{doubt.question}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-label-sm uppercase text-muted-foreground border border-border px-1.5 py-0.5">
                    {doubt.courseTitle.split(" ").slice(0, 2).join(" ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
        {/* Upcoming Live Classes */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">Live Classes</h3>
            <Link href="/studio/live-classes" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {upcomingClasses.map((cls) => (
              <div key={cls.id} className="py-3 border-b last:border-b-0 border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-body-sm font-semibold text-foreground line-clamp-1">{cls.title}</p>
                    <p className="text-label-sm text-muted-foreground mt-0.5 uppercase">
                      {new Date(cls.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {cls.duration}min
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-label-sm text-muted-foreground flex-shrink-0 ml-2">
                    <Users className="w-3 h-3" />
                    {cls.registeredCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 border border-border py-2.5 text-label-md uppercase tracking-wider hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
            <Radio className="w-4 h-4" />
            Schedule New Class
          </button>
        </div>

        {/* Course Performance */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">Course Performance</h3>
            <Link href="/studio/analytics" className="text-label-sm uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
              Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {MOCK_COURSE_ANALYTICS.map((course) => (
              <div key={course.courseId} className="py-3 border-b last:border-b-0 border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-body-sm font-semibold text-foreground line-clamp-1 flex-1 pr-2">
                    {course.courseTitle}
                  </p>
                  <span className="text-label-sm font-bold text-foreground">{formatCurrency(course.revenue)}</span>
                </div>
                <div className="flex items-center gap-3 text-label-sm text-muted-foreground">
                  <span>{course.enrollments} enrolled</span>
                  <span className="border border-border px-1">{course.completionRate}% done</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-0">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3 border-b last:border-b-0 border-border">
                <p className="text-body-sm text-foreground line-clamp-2 mb-1">{log.message}</p>
                <p className="text-label-sm text-muted-foreground uppercase">
                  {formatRelativeTime(log.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Specialized Management Tools ────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Bot className="w-5 h-5 text-foreground" />
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">{config.featureTitle}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border bg-card">
          {config.features.map((feat, idx) => (
            <div
              key={feat.name}
              className={`p-6 flex flex-col justify-between gap-5 transition-colors hover:bg-surface-container/20
                ${idx < 2 ? "border-r-0 md:border-r md:border-b-0 border-b border-border" : ""}`}
            >
              <div className="space-y-2">
                <h4 className="text-body-sm font-bold text-foreground uppercase tracking-wide">{feat.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => alert(`Simulating execution: opening ${feat.name}...`)}
                  className="px-4 py-2 border border-border bg-background text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors rounded-none"
                >
                  {feat.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "New Course", href: "/studio/courses", icon: <BookOpen className="w-6 h-6" /> },
            { label: "Upload Media", href: "/studio/media", icon: <Plus className="w-6 h-6" /> },
            { label: "Manage Doubts", href: "/studio/doubts", icon: <HelpCircle className="w-6 h-6" /> },
            { label: "AI Copilot", href: "/studio/ai-copilot", icon: <Bot className="w-6 h-6" /> },
          ].map((action, idx) => (
            <Link
              key={action.href}
              href={action.href}
              className={`p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-surface-container transition-colors group
                ${idx < 3 ? "border-r border-border" : ""}`}
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {action.icon}
              </span>
              <span className="text-label-md uppercase tracking-wider text-foreground font-bold">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
