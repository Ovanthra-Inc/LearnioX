"use client";

import { useState } from "react";
import { Search, Flag, CheckCircle, BookOpen, Star, AlertTriangle } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface AdminCourseItem {
  id: string;
  title: string;
  institutionName: string;
  price: number;
  rating: number;
  enrollmentCount: number;
  status: "live" | "draft" | "flagged";
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseItem[]>(
    MOCK_COURSES.map((c, i) => ({
      id: c.id,
      title: c.title,
      institutionName: c.institutionName,
      price: c.price ?? 0,
      rating: c.rating,
      enrollmentCount: c.enrollmentCount,
      // Mock status
      status: i === 4 ? "flagged" : "live",
    }))
  );

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "draft" | "flagged">("all");

  const handleToggleFlag = (id: string) => {
    setCourses(
      courses.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "flagged" ? ("live" as const) : ("flagged" as const);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const filteredCourses = courses.filter(
    (c) =>
      (filterStatus === "all" || c.status === filterStatus) &&
      (c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.institutionName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Global Course Catalog</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Moderate, audit, and flag marketplace courses for violating community guidelines.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Total Courses Published</p>
          <p className="text-headline-lg font-bold mt-2">{courses.length}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Active Live Products</p>
          <p className="text-headline-lg font-bold mt-2">
            {courses.filter((c) => c.status === "live").length}
          </p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Flagged / Under Moderation</p>
          <p className="text-headline-lg font-bold mt-2">
            {courses.filter((c) => c.status === "flagged").length}
          </p>
        </div>
      </div>

      {/* Course Table Section */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Platform Products</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Courses inventory index</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2 bg-background border border-border text-label-sm uppercase tracking-wider font-bold outline-none focus:border-foreground rounded-none"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="flagged">Flagged</option>
            </select>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search courses or creators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse data-table">
            <thead>
              <tr className="border-b border-foreground bg-surface-container">
                <th className="p-3 text-label-xs uppercase font-bold">Course Details</th>
                <th className="p-3 text-label-xs uppercase font-bold">Institution</th>
                <th className="p-3 text-label-xs uppercase font-bold">Rating</th>
                <th className="p-3 text-label-xs uppercase font-bold">Enrollments</th>
                <th className="p-3 text-label-xs uppercase font-bold">Price</th>
                <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                <th className="p-3 text-label-xs uppercase font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                    No matching courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{c.title}</div>
                      <div className="text-label-xs text-muted-foreground uppercase">{c.id}</div>
                    </td>
                    <td className="p-3 text-foreground font-medium">{c.institutionName}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                        {c.rating}
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{formatNumber(c.enrollmentCount)}</td>
                    <td className="p-3 font-bold text-foreground">
                      {c.price === 0 ? "Free" : formatCurrency(c.price)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                          ${
                            c.status === "live"
                              ? "bg-foreground text-background"
                              : c.status === "flagged"
                              ? "bg-red-500/10 text-red-600 border border-red-600"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleFlag(c.id)}
                        className={`text-label-xs uppercase tracking-wider font-bold hover:underline transition-all inline-flex items-center gap-1
                          ${c.status === "flagged" ? "text-foreground" : "text-red-500 hover:text-red-600"}`}
                      >
                        {c.status === "flagged" ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Unflag Course
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Flag Course
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
