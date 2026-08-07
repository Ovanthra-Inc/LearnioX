'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCourses, Course } from '@/hooks/useCourses';
import { Search, Filter, BookOpen, Sparkles, Tag, ArrowUpRight } from 'lucide-react';

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { courses, isLoading, error } = useCourses({
    search: searchQuery,
    category: selectedCategory,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          Explore Course Catalog
        </h1>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Discover verified institution courses, developer tracks, and certifications powered by LearnioX.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title, keywords, or institution..."
            className="w-full rounded-md border border-input bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">No courses found</h3>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {course.level || 'ALL LEVELS'}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {course.price > 0 ? `${course.currency || '₹'}${course.price}` : 'FREE'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 font-sans">
                  {course.title}
                </h2>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {course.subtitle || course.description || 'Comprehensive institution curriculum track.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  {course.access_type || 'INSTITUTION'}
                </span>
                <span className="flex items-center font-semibold text-foreground group-hover:text-primary transition-colors">
                  View Course
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      )}
    </div>
  );
}
