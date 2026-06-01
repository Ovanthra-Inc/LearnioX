"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_CATEGORIES, MOCK_COURSES } from "@/lib/mock-data/courses";
import { CourseCard } from "@/components/shared/course-card";
import { ArrowLeft, BookOpen } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);

  // Find category
  const category = MOCK_CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-headline-md font-bold text-foreground">Category Not Found</h1>
        <p className="text-muted-foreground">The category "{slug}" does not exist.</p>
        <Link
          href="/search"
          className="inline-block px-6 py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
        >
          Browse All Courses
        </Link>
      </div>
    );
  }

  // Filter courses by category
  const categoryCourses = MOCK_COURSES.filter((c) => c.categoryId === category.id);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Explore Discipline
        </span>
        <h1 className="text-headline-lg font-bold text-foreground mt-4 leading-tight">
          {category.name}
        </h1>
        <p className="text-body-md text-muted-foreground mt-2">
          Discover {categoryCourses.length} premium programs from verified coaching institutions.
        </p>
      </div>

      {/* Course Grid */}
      {categoryCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border">
          {categoryCourses.map((course) => (
            <div key={course.id} className="border-r border-b border-border">
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border p-16 text-center text-muted-foreground space-y-4">
          <BookOpen className="w-12 h-12 mx-auto opacity-40 text-foreground" />
          <h3 className="text-headline-sm font-bold text-foreground">No courses in this category yet</h3>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
            Our institutions are currently uploading lessons and assignments for this category. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
