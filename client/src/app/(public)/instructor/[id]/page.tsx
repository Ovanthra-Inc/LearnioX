"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_INSTRUCTORS } from "@/lib/mock-data/users";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { CourseCard } from "@/components/shared/course-card";
import { Star, Award, BookOpen, ArrowLeft, Briefcase, Mail } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface InstructorPageProps {
  params: Promise<{ id: string }>;
}

export default function InstructorProfilePage({ params }: InstructorPageProps) {
  const { id } = use(params);

  // Find instructor
  const instructor = MOCK_INSTRUCTORS.find((i) => i.id === id) || MOCK_INSTRUCTORS[0];

  // Filter courses taught by this instructor
  const taughtCourses = MOCK_COURSES.filter((c) => 
    c.instructorIds.includes(instructor.id)
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Back link */}
      <div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>

      {/* Profile Header */}
      <div className="border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="w-20 h-20 md:w-32 md:h-32 bg-surface-container border border-border flex items-center justify-center text-display-sm font-bold uppercase text-muted-foreground flex-shrink-0">
          {instructor.name.substring(0, 2).toUpperCase()}
        </div>

        {/* Bio Details */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h1 className="text-headline-md md:text-headline-lg font-bold text-foreground">{instructor.name}</h1>
            <p className="text-body-md text-muted-foreground font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-foreground" /> {instructor.title}
            </p>
          </div>

          <p className="text-body-md text-muted-foreground leading-relaxed max-w-3xl">
            {instructor.bio}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-foreground fill-current" />
              <strong className="text-foreground font-bold">{instructor.rating}</strong> Rating
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-foreground" />
              <strong className="text-foreground font-bold">{formatNumber(instructor.reviewCount)}</strong> Reviews
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-foreground" />
              <strong className="text-foreground font-bold">{instructor.courseCount}</strong> Programs
            </span>
            {instructor.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-foreground" />
                <span className="truncate">{instructor.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expertise Skills */}
      {instructor.expertise && instructor.expertise.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Areas of Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {instructor.expertise.map((skill) => (
              <span key={skill} className="px-3 py-1 border border-border bg-surface text-xs uppercase font-bold text-muted-foreground">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Programs List */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-headline-sm font-bold uppercase tracking-tight">Courses Taught by {instructor.name.split(" ")[0]}</h3>
        </div>
        
        {taughtCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border">
            {taughtCourses.map((course) => (
              <div key={course.id} className="border-r border-b border-border">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border p-12 text-center text-muted-foreground">
            No active courses listed for this instructor.
          </div>
        )}
      </div>
    </div>
  );
}
