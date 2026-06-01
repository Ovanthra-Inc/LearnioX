"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Users, Clock, Star, ArrowUpRight, ArrowDownRight, Award, HelpCircle } from "lucide-react";
import { MOCK_COURSE_ANALYTICS, MOCK_STUDIO_ANALYTICS } from "@/lib/mock-data/studio";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function StudioAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("30d");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Math conversions
  const stats = MOCK_STUDIO_ANALYTICS;
  const coursePerformance = MOCK_COURSE_ANALYTICS;

  // Custom data based on timeframe
  const activeLearners = timeframe === "7d" ? 2840 : timeframe === "30d" ? stats.activeLearners : 18500;
  const watchHours = timeframe === "7d" ? 1280 : timeframe === "30d" ? stats.watchTimeHours : 98200;

  // Mock monthly breakdown for visual chart
  const monthlyEngagements = [
    { label: "Dec", hours: 4200, users: 1100 },
    { label: "Jan", hours: 5100, users: 1400 },
    { label: "Feb", hours: 6400, users: 1900 },
    { label: "Mar", hours: 7800, users: 2300 },
    { label: "Apr", hours: 9100, users: 2800 },
    { label: "May", hours: 12400, users: 3400 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Analytics</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Analyze your academy's traffic, course metrics, and user engagement metrics.
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 text-label-xs uppercase font-bold tracking-wider border transition-all rounded-none
                ${
                  timeframe === t
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
            >
              {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Active Learners</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{stats.learnersChange}%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">{formatNumber(activeLearners)}</p>
        </div>

        <div className="p-6 border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Watch Hours</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{stats.watchTimeChange}%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">{formatNumber(watchHours)}h</p>
        </div>

        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Avg Course Completion</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{stats.completionRateChange}%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">{stats.completionRate}%</p>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start">
            <span className="text-label-sm text-muted-foreground uppercase">Platform Rating</span>
            <span className="text-label-xs font-bold text-foreground bg-surface-container px-1 py-0.5 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-foreground" />
              Top 5%
            </span>
          </div>
          <p className="text-headline-lg font-bold mt-2">4.82 / 5.0</p>
        </div>
      </div>

      {/* Main Analysis Chart & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border">
        {/* Engagement chart */}
        <div className="lg:col-span-2 border-r border-border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-headline-sm font-bold">Watch Time Growth</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Hours of course lectures played</p>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="p-2 bg-background border border-border text-label-sm uppercase tracking-wider font-bold outline-none focus:border-foreground rounded-none"
            >
              <option value="all">All Courses</option>
              {coursePerformance.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseTitle.split(" ").slice(0, 3).join(" ")}
                </option>
              ))}
            </select>
          </div>

          {/* Simple simulated CSS Chart */}
          <div className="flex items-end gap-4 h-48 pt-4">
            {monthlyEngagements.map((item) => {
              const maxVal = Math.max(...monthlyEngagements.map((m) => m.hours));
              const percentage = (item.hours / maxVal) * 100;
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-label-xs font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatNumber(item.hours)}h
                  </span>
                  <div
                    className="w-full bg-foreground hover:bg-muted-foreground transition-all duration-300"
                    style={{ height: `${percentage}%` }}
                    title={`Watch Hours: ${item.hours}`}
                  />
                  <span className="text-label-sm font-bold text-foreground uppercase mt-1">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold">AI Analytics Insights</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Realtime optimization suggestions</p>
          </div>

          <div className="border border-border p-5 space-y-4 bg-surface-container">
            <h4 className="text-label-sm font-bold uppercase text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-foreground" />
              Content Optimization
            </h4>
            <p className="text-body-sm text-muted-foreground leading-relaxed">
              We noticed a high dropout rate (18%) in <strong>Advanced UI/UX Architecture</strong>,
              specifically around lesson 4, "CSS Grid vs Auto Layout". Inserting a 5-question
              refresher quiz at the end of lesson 3 could improve retention by up to 22%.
            </p>
            <div className="border-t border-border pt-4">
              <h5 className="text-label-sm font-bold uppercase text-foreground mb-1">Recommended Action</h5>
              <p className="text-body-sm text-muted-foreground">
                Deploy AI quiz generation inside lesson 3 editor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Course Breakdown Table */}
      <div className="border border-border p-6 space-y-6">
        <div>
          <h3 className="text-headline-sm font-bold">Course-level Performance</h3>
          <p className="text-label-sm text-muted-foreground uppercase">Metrics per published product</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground bg-surface-container">
                <th className="p-3 text-label-xs uppercase font-bold">Course Title</th>
                <th className="p-3 text-label-xs uppercase font-bold">Enrollments</th>
                <th className="p-3 text-label-xs uppercase font-bold">Completion Rate</th>
                <th className="p-3 text-label-xs uppercase font-bold">Total watch hours</th>
                <th className="p-3 text-label-xs uppercase font-bold">Avg Rating</th>
                <th className="p-3 text-label-xs uppercase font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {coursePerformance.map((course) => (
                <tr
                  key={course.courseId}
                  className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                >
                  <td className="p-3 font-semibold text-foreground">{course.courseTitle}</td>
                  <td className="p-3 font-medium">{formatNumber(course.enrollments)}</td>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted-foreground/20 h-2 rounded-none overflow-hidden">
                        <div
                          className="bg-foreground h-full"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <span>{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatNumber(course.watchTimeHours)}h</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                      {course.rating}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-foreground">{formatCurrency(course.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
