"use client";

import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { CourseCard } from "@/components/shared/course-card";
import { Bookmark, Search } from "lucide-react";

export default function LearnerSavedCoursesPage() {
  // Mock saved courses subset
  const savedCourses = MOCK_COURSES.slice(1, 3);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Saved Courses</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Programs you have bookmarked for later
        </p>
      </div>

      {/* Grid */}
      {savedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border">
          {savedCourses.map((course) => (
            <div key={course.id} className="border-r border-b border-border">
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border p-16 text-center text-muted-foreground space-y-4 max-w-xl mx-auto">
          <Bookmark className="w-12 h-12 mx-auto opacity-40 text-foreground" />
          <h3 className="text-headline-sm font-bold text-foreground">No bookmarked courses</h3>
          <p className="text-body-sm text-muted-foreground">
            Explore active coaching directories or search disciplines to save your preferred programs.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90"
          >
            <Search className="w-4 h-4" /> Search Directory
          </Link>
        </div>
      )}
    </div>
  );
}
