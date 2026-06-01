import Link from "next/link";
import Image from "next/image";
import { cn, formatCurrency, formatDuration, formatNumber } from "@/lib/utils";
import type { Course } from "@/types/course";
import { Star, Clock, Users } from "lucide-react";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const href = `/course/${course.slug}`;

  if (variant === "horizontal") {
    return (
      <Link href={href} className={cn("course-card flex group", className)}>
        <div className="w-2/5 md:w-48 flex-shrink-0 relative overflow-hidden bg-surface-container border-r border-border">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover grayscale group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 40vw, 12rem"
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <span className="text-muted-foreground text-label-sm uppercase">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-1">
              {course.institutionName}
            </p>
            <h3 className="text-body-md font-bold text-foreground line-clamp-2 leading-snug mb-2">
              {course.title}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-label-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {course.rating}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(course.totalDuration)}
              </span>
            </div>
            <span className="text-label-md font-bold text-foreground">
              {course.pricingType === "free" ? "Free" : formatCurrency(course.price ?? 0)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("course-card flex flex-col group p-3", className)}>
        <p className="text-label-sm text-muted-foreground uppercase tracking-widest mb-1">
          {course.institutionName}
        </p>
        <h3 className="text-body-md font-bold text-foreground line-clamp-2 flex-1">
          {course.title}
        </h3>
        <div className="mt-auto pt-3 border-t border-border flex justify-between items-center">
          <div className="flex items-center gap-1 text-label-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDuration(course.totalDuration)}
          </div>
          <span className="text-label-md font-bold text-foreground">
            {course.pricingType === "free" ? "Free" : formatCurrency(course.price ?? 0)}
          </span>
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link href={href} className={cn("course-card flex flex-col group h-full", className)}>
      {/* Thumbnail */}
      <div className="relative h-48 border-b border-border overflow-hidden bg-surface-container">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover grayscale group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <span className="text-muted-foreground text-label-sm uppercase">No Thumbnail</span>
          </div>
        )}
        {course.isBestseller && (
          <div className="absolute top-3 left-3 badge badge-primary text-label-sm">
            Bestseller
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-grow flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label-sm text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5 capitalize">
              {course.level}
            </span>
            <span className="flex items-center gap-1 text-label-sm text-foreground font-semibold">
              <Star className="w-3 h-3 fill-current" />
              {course.rating}
            </span>
          </div>
          <h3 className="text-headline-sm font-bold text-foreground line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-body-sm text-muted-foreground line-clamp-1 border-l-2 border-foreground pl-2">
            {course.institutionName}
          </p>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-label-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatNumber(course.enrollmentCount)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.totalDuration)}
            </span>
          </div>
          <div className="text-right">
            {course.pricingType === "free" ? (
              <span className="text-label-md font-bold text-foreground uppercase tracking-wider">Free</span>
            ) : (
              <div>
                <span className="text-label-md font-bold text-foreground">
                  {formatCurrency(course.price ?? 0)}
                </span>
                {course.originalPrice && (
                  <span className="text-label-sm text-muted-foreground line-through ml-1">
                    {formatCurrency(course.originalPrice)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
