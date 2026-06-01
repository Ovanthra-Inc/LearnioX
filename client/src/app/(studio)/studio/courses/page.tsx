import Link from "next/link";
import { MOCK_COURSE_ANALYTICS } from "@/lib/mock-data/studio";
import { BadgeStatus } from "@/components/shared/ui-elements";
import { formatCurrency } from "@/lib/utils";
import { Plus, BookOpen, Edit, BarChart3 } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";

export const metadata = { title: "Courses — Academy Studio" };

export default function StudioCoursesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Courses</h1>
          <p className="text-body-sm text-muted-foreground mt-1">Manage your course catalog</p>
        </div>
        <div className="flex gap-3">
          <Link href="/studio/courses/import" className="px-4 py-2 border border-border hover:border-foreground transition-colors text-label-md uppercase tracking-wider">
            Import
          </Link>
          <Link href="/studio/courses/new/build" className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity font-bold">
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search courses..."
          className="flex-1 min-w-[200px] h-10 px-4 border border-border bg-surface hover:border-foreground focus:border-foreground outline-none transition-colors text-body-sm text-foreground placeholder:text-muted-foreground"
        />
        {["All", "Published", "Draft", "Archived"].map((filter) => (
          <button
            key={filter}
            className={`h-10 px-4 border text-label-md uppercase tracking-wider transition-colors ${filter === "All" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Courses Table */}
      <div className="border border-border">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th className="hidden md:table-cell">Students</th>
              <th className="hidden md:table-cell">Completion</th>
              <th className="hidden lg:table-cell">Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COURSES.slice(2, 6).map((course, idx) => {
              const courseAnalytics = MOCK_COURSE_ANALYTICS[idx];
              return (
                <tr key={course.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-container border border-border flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-body-sm line-clamp-1">
                          {course.title}
                        </p>
                        <p className="text-label-sm text-muted-foreground uppercase">
                          {course.totalLessons} lessons · {course.level}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell font-semibold">
                    {courseAnalytics?.enrollments ?? course.enrollmentCount}
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-surface-container border border-border overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${courseAnalytics?.completionRate ?? 70}%` }}
                        />
                      </div>
                      <span className="text-label-sm text-muted-foreground">
                        {courseAnalytics?.completionRate ?? 70}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell font-semibold">
                    {formatCurrency(courseAnalytics?.revenue ?? course.price ?? 0)}
                  </td>
                  <td>
                    <BadgeStatus status={course.isPublished ? "published" : "draft"} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/studio/courses/${course.id}/build`}
                        className="flex items-center gap-1 px-3 py-1.5 border border-border hover:border-foreground transition-colors text-label-sm uppercase tracking-wider"
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                      <Link
                        href={`/studio/courses/${course.id}/analytics`}
                        className="flex items-center gap-1 px-3 py-1.5 border border-border hover:border-foreground transition-colors text-label-sm uppercase tracking-wider"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Analytics</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
